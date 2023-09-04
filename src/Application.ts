import { Logger } from '@l2beat/backend-tools'
import { writeFile } from 'fs/promises'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

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
      transport: http(),
      batch: {
        multicall: true,
      },
    })

    const pipeline = new SourcePipeline()
      .add(new JsonSource('tokens.json', logger))
      .add(new JsonSource('data/axelar-ethereum.json', logger))
      .add(new CoingeckoSource(logger))
      .merge()
      .add(new OnChainMetadataSource(mainnetClient, 1, logger.tag('mainnet')))
      .add(
        new DeploymentSource(
          config.etherscan.mainnet.apiUrl,
          config.etherscan.mainnet.apiKey,
          mainnetClient,
          1,
          logger.tag('mainnet'),
        ),
      )

    this.start = async () => {
      const tokens = await pipeline.getTokens()
      await writeFile('tokens.json', JSON.stringify(tokens, null, 2))
    }
  }
}
