import { Logger } from '@l2beat/backend-tools'
import { writeFile } from 'fs/promises'
import { PublicClient, createPublicClient, http } from 'viem'
import { arbitrum, mainnet, optimism } from 'viem/chains'

import { Config } from './config/Config'
import { SourcePipeline } from './pipeline/SourcePipeline'
import { CoingeckoSource } from './sources/CoingeckoSource'
import { DeploymentSource } from './sources/DeploymentSource'
import { JsonSource } from './sources/JsonSource'
import { OnChainMetadataSource } from './sources/OnChainMetadataSource'

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
      .add(new JsonSource('data/axelar-ethereum.json', logger))
      .add(new CoingeckoSource(logger))
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

    this.start = async () => {
      const tokens = await pipeline.getTokens()
      await writeFile('tokens.json', JSON.stringify(tokens, null, 2))
    }
  }
}
