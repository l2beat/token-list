import { writeFile } from 'fs/promises'
import { z } from 'zod'

import { TokenListing } from './TokenListing'

export class Output {
  constructor(public readonly tokenFile: string) {}

  async write(tokens: TokenListing[]) {
    // We need this to enforce consistent sorting and property order
    const data = z
      .array(TokenListing)
      .parse(tokens)
      .sort((a, b) => a.address.localeCompare(b.address.toString()))
    await writeFile(this.tokenFile, JSON.stringify(data, null, 2))
  }
}
