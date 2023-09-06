import { TokenListing } from '../TokenListing'

export interface TokenTransformer {
  transform(tokens: TokenListing[]): TokenListing[]
}
