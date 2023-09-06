import { TokenListing } from '../TokenListing'

export interface TokenSource {
  getTokens(tokens: readonly TokenListing[]): Promise<TokenListing[]>
}
