import { Logger } from '@l2beat/backend-tools'
import { writeFile } from 'fs/promises'
import { createPublicClient, http, PublicClient } from 'viem'
import { arbitrum, mainnet, optimism } from 'viem/chains'
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

    const mainnetClient = createPublicClient({
      chain: mainnet,
      transport: http(config.jsonRpc.mainnetUrl),
      batch: {
        multicall: true,
      },
    })

    const arbitrumClient = createPublicClient({
      chain: arbitrum,
      transport: http(config.jsonRpc.arbitrumUrl),
      batch: {
        multicall: true,
      },
    })

    const optimismClient: PublicClient = createPublicClient({
      // TODO: breaks types because of different block type
      // chain: optimism,
      transport: http(config.jsonRpc.optimismUrl),
      batch: {
        multicall: true,
      },
    })

    const pipeline = new SourcePipeline()
      .add(new JsonSource('tokens.json', logger))
      .add(new CoingeckoSource(logger))
      .add(
        new AxelarSource(
          mainnetClient,
          mainnet.id,
          config.axelar.mainnetGateway,
          logger.tag('mainnet'),
        ),
      )
      .add(
        new AxelarSource(
          arbitrumClient,
          arbitrum.id,
          config.axelar.arbitrumGateway,
          logger.tag('arbitrum'),
        ),
      )
      .add(
        new AxelarSource(
          optimismClient,
          optimism.id,
          config.axelar.optimismGateway,
          logger.tag('optimism'),
        ),
      )
      .merge()
      .add(
        new OnChainMetadataSource(
          mainnetClient,
          mainnet.id,
          logger.tag('mainnet'),
        ),
      )
      .add(
        new OnChainMetadataSource(
          arbitrumClient,
          arbitrum.id,
          logger.tag('arbitrum'),
        ),
      )
      .add(
        new OnChainMetadataSource(
          optimismClient,
          optimism.id,
          logger.tag('optimism'),
        ),
      )
      .add(
        new DeploymentSource(
          config.etherscan.mainnet.apiUrl,
          config.etherscan.mainnet.apiKey,
          mainnetClient,
          mainnet.id,
          logger.tag('mainnet'),
        ),
      )
      .add(
        new DeploymentSource(
          config.etherscan.arbitrum.apiUrl,
          config.etherscan.arbitrum.apiKey,
          arbitrumClient,
          arbitrum.id,
          logger.tag('arbitrum'),
        ),
      )
      .add(
        new DeploymentSource(
          config.etherscan.optimism.apiUrl,
          config.etherscan.optimism.apiKey,
          optimismClient,
          optimism.id,
          logger.tag('optimism'),
        ),
      )
      .merge()
      .add(new AxelarHeuristicSource())

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
