import { Logger } from '@l2beat/backend-tools'

import { PipelineMerger } from '../pipeline/PipelineMerger'
import { TokenListing } from '../TokenListing'

export class UnionMerger implements PipelineMerger {
  constructor(private readonly logger: Logger) {
    this.logger = logger.for(this)
  }

  merge(main: TokenListing[], merged: TokenListing[]): TokenListing[] {
    this.logger.info(
      `Merging ${main.length} tokens into ${merged.length} tokens`,
    )
    const result: TokenListing[] = []

    for (const token of main) {
      const existing = merged.find((t) => t.address === token.address)
      if (existing) {
        result.push(token)
      }
    }

    this.logger.info(`Resulted in ${result.length} tokens`)

    return result
  }
}
