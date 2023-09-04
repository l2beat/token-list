import { TokenListing } from '../TokenListing'

export interface TokenSource {
  getTokens(knownTokens: readonly TokenListing[]): Promise<TokenListing[]>
}
