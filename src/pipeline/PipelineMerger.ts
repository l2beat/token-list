import { TokenListing } from '../TokenListing'
import { type SourcePipeline } from './SourcePipeline'

export interface PipelineMerger {
  merge(main: TokenListing[], merged: TokenListing[]): TokenListing[]
}

export interface MergeSource {
  pipeline: SourcePipeline
  merger: PipelineMerger
}
