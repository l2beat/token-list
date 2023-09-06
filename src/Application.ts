import { Logger } from '@l2beat/backend-tools'
import { createPublicClient, http, PublicClient } from 'viem'

import { Config } from './config/Config'
import { Output } from './Output'
import { SourcePipeline } from './pipeline/SourcePipeline'
import { AxelarConfigSource } from './sources/AxelarConfigSource'
import { AxelarGatewaySource } from './sources/AxelarGatewaySource'
import { CoingeckoSource } from './sources/CoingeckoSource'
import { DeploymentSource } from './sources/DeploymentSource'
import { JsonSource } from './sources/JsonSource'
import { OnChainMetadataSource } from './sources/OnChainMetadataSource'
import { TokenListSource } from './sources/TokenListSource'
import { Stats } from './Stats'

export class Application {
  start: () => Promise<void>

  constructor(config: Config) {
    const logger = new Logger({
      logLevel: 'INFO',
      format: 'pretty',
      colors: true,
    })

    const chainSources = getChainSources(config, logger)

    // #region pipeline

    const pipeline = new SourcePipeline()

    pipeline.add(new JsonSource(config.tokenFile, logger))
    pipeline.add(new CoingeckoSource(logger, config.chains))
    pipeline.add(
      new AxelarConfigSource(logger, config.axelarConfig, config.chains),
    )

    for (const { axelarSource } of chainSources) {
      if (axelarSource) {
        pipeline.add(axelarSource)
      }
    }

    for (const list of config.tokenLists) {
      pipeline.add(
        new TokenListSource(
          list.url,
          list.tag,
          logger.tag(list.tag),
          config.chains,
        ),
      )
    }

    pipeline.merge()

    for (const sources of chainSources) {
      if (sources.onChainMetadataSource) {
        pipeline.add(sources.onChainMetadataSource)
      }
      if (sources.deploymentSource) {
        pipeline.add(sources.deploymentSource)
      }
    }

    pipeline.merge()
    // pipeline.transform(new AxelarHeuristic(logger))

    // #endregion

    const stats = new Stats(logger, config.chains)
    const output = new Output(config.tokenFile)

    this.start = async () => {
      const tokens = await pipeline.getTokens()
      stats.outputStats(tokens)
      await output.write(tokens)

      // TODO: temporary
      const axelarTokens = tokens
        .filter(
          (token) => token.tags?.axelarBridged && token.chain?.name === 'Base',
        )
        .map((token) => ({
          symbol: token.onChainMetadata?.symbol,
          sourceChain: token.bridge?.sourceChainRaw,
          address: token.address,
          sourceToken: token.bridge?.sourceTokenRaw,
        }))

      console.table(axelarTokens)
    }
  }
}

function getChainSources(config: Config, logger: Logger) {
  return config.chains.map((chain) => {
    let client: PublicClient | undefined
    let axelarSource: AxelarGatewaySource | undefined
    let onChainMetadataSource: OnChainMetadataSource | undefined
    let deploymentSource: DeploymentSource | undefined

    if (chain.jsonRpcUrl) {
      client = createPublicClient({
        chain: chain.viemChain,
        transport: http(chain.jsonRpcUrl),
        batch: {
          multicall: true,
        },
      })
    }

    if (client && chain.axelarGateway) {
      axelarSource = new AxelarGatewaySource(
        client,
        chain,
        chain.axelarGateway,
        logger.tag(chain.tag),
      )
    }

    if (client) {
      onChainMetadataSource = new OnChainMetadataSource(
        client,
        chain.id,
        logger.tag(chain.tag),
      )
    }

    if (client && chain.etherscanApiUrl && chain.etherscanApiKey) {
      deploymentSource = new DeploymentSource(
        chain.etherscanApiUrl,
        chain.etherscanApiKey,
        !!chain.skipDeploymentTransaction,
        client,
        chain.id,
        logger.tag(chain.tag),
      )
    }

    return {
      chain,
      client,
      axelarSource,
      onChainMetadataSource,
      deploymentSource,
    }
  })
}
