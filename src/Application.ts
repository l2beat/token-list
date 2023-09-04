import { writeFile } from 'fs/promises'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

import { Config } from './config/Config'
import { SourcePipeline } from './pipeline/SourcePipeline'
import { CoingeckoSource } from './sources/CoingeckoSource'
import { EtherscanMetadataSource } from './sources/EtherscanSource'
import { JsonSource } from './sources/JsonSource'
import { OnChainMetadataSource } from './sources/OnChainMetadataSource'

export class Application {
  start: () => Promise<void>

  constructor(config: Config) {
    const mainnetClient = createPublicClient({
      chain: mainnet,
      transport: http(),
      batch: {
        multicall: true,
      },
    })

    const pipeline = new SourcePipeline()
      .add(new JsonSource('tokens.json'))
      .add(new JsonSource('data/axelar-ethereum.json'))
      .add(new CoingeckoSource())
      // .add(new AxelarSource())
      // .add(new MultichainApiSource())
      .merge()
      .add(new OnChainMetadataSource(mainnetClient, 1))
      .add(
        new EtherscanMetadataSource(
          config.etherscan.mainnet.apiUrl,
          config.etherscan.mainnet.apiKey,
          mainnetClient,
          1,
        ),
      )
    // .merge()
    // .add(new AxelarNativeDeterminationSource())

    this.start = async () => {
      const tokens = await pipeline.getTokens()
      await writeFile('tokens.json', JSON.stringify(tokens, null, 2))
    }
  }
}
