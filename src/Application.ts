import { writeFile } from 'fs/promises'

import { SourcePipeline } from './pipeline/SourcePipeline'
import { JsonSource } from './sources/JsonSource'
import { CoingeckoSource } from './sources/CoingeckoSource'

export class Application {
  start: () => Promise<void>

  constructor() {
    const pipeline = new SourcePipeline()
      .add(new JsonSource('tokens.json'))
      .add(new CoingeckoSource())

    this.start = async () => {
      const tokens = await pipeline.getTokens()
      await writeFile('tokens.json', JSON.stringify(tokens, null, 2))
    }
  }
}
