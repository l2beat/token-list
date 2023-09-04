import { readFile } from 'fs/promises'
import { z } from 'zod'

import { TokenSource } from '../pipeline/TokenSource'
import { TokenListing } from '../TokenListing'
import { Logger } from '@l2beat/backend-tools'

export class JsonSource implements TokenSource {
  constructor(
    private readonly filePath: string,
    private logger: Logger,
  ) {
    this.logger = logger.for(this)
  }

  async getTokens(): Promise<TokenListing[]> {
    const json = await readFile(this.filePath, 'utf-8')
    const result = z.array(TokenListing).parse(JSON.parse(json))
    this.logger.info('Got tokens', { length: result.length })
    return result
  }
}
