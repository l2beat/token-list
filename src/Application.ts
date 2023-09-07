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
import { OrbitSource } from './sources/OrbitSource'
import { TokenListSource } from './sources/TokenListSource'
import { WormholeSource } from './sources/WormholeSource'
import { Stats } from './Stats'
import { CanonicalArbitrumHeuristic } from './transformers/CanonicalArbitrumHeuristic'
import { CanonicalOptimismHeuristic } from './transformers/CanonicalOptimismHeuristic'
import { ChainTransformer } from './transformers/ChainTransformer'

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

    if (config.sources.coingecko) {
      pipeline.add(new CoingeckoSource(logger, config.chains))
    }

    if (config.sources.axelarConfig) {
      pipeline.add(
        new AxelarConfigSource(logger, config.axelarListUrl, config.chains),
      )
    }

    if (config.sources.axelarGateway) {
      for (const { axelarSource } of chainSources) {
        if (axelarSource) {
          pipeline.add(axelarSource)
        }
      }
    }

    if (config.sources.wormhole) {
      pipeline.add(
        new WormholeSource(config.wormholeListUrl, logger, config.chains),
      )
    }

    if (config.sources.orbit) {
      pipeline.add(new OrbitSource(config.orbitListUrl, logger, config.chains))
    }

    if (config.sources.tokenLists) {
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
    }

    pipeline.merge()
    pipeline.transform(new ChainTransformer(logger, config.chains))

    if (config.sources.onChainMetadata) {
      for (const sources of chainSources) {
        if (sources.onChainMetadataSource) {
          pipeline.add(sources.onChainMetadataSource)
        }
      }
    }

    if (config.sources.deployments) {
      for (const sources of chainSources) {
        if (sources.deploymentSource) {
          pipeline.add(sources.deploymentSource)
        }
      }
    }

    pipeline.merge()
    pipeline.transform(new CanonicalArbitrumHeuristic())
    pipeline.transform(new CanonicalOptimismHeuristic())

    // #endregion

    const stats = new Stats(logger, config.chains)
    const output = new Output(config.tokenFile)

    this.start = async () => {
      const tokens = await pipeline.getTokens()
      stats.outputStats(tokens)
      await output.write(tokens)
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
