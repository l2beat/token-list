import { mergeListings, TokenListing } from '../TokenListing'
import { MergeSource, PipelineMerger } from './PipelineMerger'
import { TokenSource } from './TokenSource'
import { TokenTransformer } from './TokenTransformer'

export class SourcePipeline {
  private readonly sources: (TokenSource[] | TokenTransformer | MergeSource)[] =
    []

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

  merge(pipeline: SourcePipeline, merger: PipelineMerger): this {
    const last = this.sources[this.sources.length - 1]
    const mergeSource: MergeSource = { pipeline, merger }
    if (Array.isArray(last) && last.length === 0) {
      this.sources[this.sources.length - 1] = mergeSource
    } else {
      this.sources.push(mergeSource)
    }
    return this
  }

  commit(): this {
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
      } else if ('transform' in step) {
        result = step.transform(result)
      } else {
        const mergedTokens = await step.pipeline.getTokens()
        result = step.merger.merge(result, mergedTokens)
      }
    }
    return result
  }
}
