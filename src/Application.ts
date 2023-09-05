import { Logger } from '@l2beat/backend-tools'
import { writeFile } from 'fs/promises'
import { createPublicClient, http, PublicClient } from 'viem'
import { z } from 'zod'

import { Config } from './config/Config'
import { SourcePipeline } from './pipeline/SourcePipeline'
import { AxelarHeuristicSource } from './sources/AxelarHeuristicSource'
import { AxelarSource } from './sources/AxelarSource'
import { CoingeckoSource } from './sources/CoingeckoSource'
import { DeploymentSource } from './sources/DeploymentSource'
import { JsonSource } from './sources/JsonSource'
import { OnChainMetadataSource } from './sources/OnChainMetadataSource'
import { TokenListing } from './TokenListing'

export class Application {
  start: () => Promise<void>

  constructor(config: Config) {
    const logger = new Logger({
      logLevel: 'INFO',
      format: 'pretty',
      colors: true,
    })

    const chainSources = config.chains.map((chain) => {
      let client: PublicClient | undefined
      let axelarSource: AxelarSource | undefined
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
        axelarSource = new AxelarSource(
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

    const pipeline = new SourcePipeline()

    pipeline.add(new JsonSource('tokens.json', logger))
    pipeline.add(new CoingeckoSource(logger, config.chains))

    for (const { axelarSource } of chainSources) {
      if (axelarSource) {
        pipeline.add(axelarSource)
      }
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

    pipeline.add(new AxelarHeuristicSource())

    this.start = async () => {
      const tokens = await pipeline.getTokens()
      // We need this to enforce consistent sorting and property order
      const data = z
        .array(TokenListing)
        .parse(tokens)
        .sort((a, b) => a.address.localeCompare(b.address.toString()))
      await writeFile('tokens.json', JSON.stringify(data, null, 2))
    }
  }
}
