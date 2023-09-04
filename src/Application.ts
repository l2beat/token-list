import { writeFile } from 'fs/promises'

import { SourcePipeline } from './pipeline/SourcePipeline'
import { JsonSource } from './sources/JsonSource'

export class Application {
  start: () => Promise<void>

  constructor() {
    const pipeline = new SourcePipeline().add(new JsonSource('tokens.json'))

    this.start = async () => {
      const tokens = await pipeline.getTokens()
      await writeFile('tokens.json', JSON.stringify(tokens, null, 2))
    }
  }
}
