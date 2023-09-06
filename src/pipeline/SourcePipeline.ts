import { mergeListings, TokenListing } from '../TokenListing'
import { TokenSource } from './TokenSource'
import { TokenTransformer } from './TokenTransformer'

export class SourcePipeline {
  private readonly sources: (TokenSource[] | TokenTransformer)[] = []

  add(source: TokenSource): this {
    const last = this.sources[this.sources.length - 1]
    if (!last) {
      this.sources.push([source])
    } else {
      if (Array.isArray(last)) {
        last.push(source)
      } else {
        this.sources.push([source])
      }
    }
    return this
  }

  transform(transformer: TokenTransformer): this {
    const last = this.sources[this.sources.length - 1]
    if (Array.isArray(last) && last.length === 0) {
      this.sources[this.sources.length - 1] = transformer
    } else {
      this.sources.push(transformer)
    }
    return this
  }

  merge(): this {
    const last = this.sources[this.sources.length - 1]
    if (Array.isArray(last) && last.length !== 0) {
      this.sources.push([])
    }
    return this
  }

  async getTokens(): Promise<TokenListing[]> {
    let result: TokenListing[] = []
    for (const step of this.sources) {
      if (Array.isArray(step)) {
        const listings = await Promise.all(
          step.map((source) => source.getTokens(result)),
        )
        result = mergeListings([result, ...listings])
      } else {
        result = step.transform(result)
      }
    }
    return result
  }
}
