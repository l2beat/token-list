import { writeFile } from 'fs/promises'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

import { SourcePipeline } from './pipeline/SourcePipeline'
import { CoingeckoSource } from './sources/CoingeckoSource'
import { JsonSource } from './sources/JsonSource'
import { OnChainMetadataSource } from './sources/OnChainMetadataSource'

export class Application {
  start: () => Promise<void>

  constructor() {
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
    // .add(new EtherscanMetadataSource())
    // .merge()
    // .add(new AxelarNativeDeterminationSource())

    this.start = async () => {
      const tokens = await pipeline.getTokens()
      await writeFile('tokens.json', JSON.stringify(tokens, null, 2))
    }
  }
}
