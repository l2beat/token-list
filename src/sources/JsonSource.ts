import { readFile } from 'fs/promises'
import { z } from 'zod'

import { TokenSource } from '../pipeline/TokenSource'
import { TokenListing } from '../TokenListing'

export class JsonSource implements TokenSource {
  constructor(private readonly filePath: string) {}

  async getTokens(): Promise<TokenListing[]> {
    const json = await readFile(this.filePath, 'utf-8')
    return z.array(TokenListing).parse(JSON.parse(json))
  }
}
