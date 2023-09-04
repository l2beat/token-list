import { mergeListings, TokenListing } from '../TokenListing'
import { TokenSource } from './TokenSource'

export class SourcePipeline {
  private readonly sources: TokenSource[][] = []

  add(source: TokenSource): this {
    const last = this.sources[this.sources.length - 1]
    if (!last) {
      this.sources.push([source])
    } else {
      last.push(source)
    }
    return this
  }

  merge(): this {
    this.sources.push([])
    return this
  }

  async getTokens(): Promise<TokenListing[]> {
    let result: TokenListing[] = []
    for (const step of this.sources) {
      const listings = await Promise.all(
        step.map((source) => source.getTokens(result)),
      )
      result = mergeListings([result, ...listings])
    }
    return result
  }
}
