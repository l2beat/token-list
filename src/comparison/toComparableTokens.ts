import { Address } from '../Address'
import { TokenListing } from '../TokenListing'

export interface ComparableToken {
  chainId: number
  coingeckoId: string
  address: string
}

export function toComparableTokens(tokens: TokenListing[]): ComparableToken[] {
  return tokens
    .filter(
      (t) =>
        t.chain !== undefined &&
        t.identifiers !== undefined &&
        t.identifiers.coingeckoId !== undefined,
    )
    .map((t) => {
      const chainId = t.chain?.id
      if (chainId === undefined) {
        throw new Error(`Chain ID not found for token ${t.address.toString()}`)
      }
      const coingeckoId = t.identifiers?.coingeckoId
      if (coingeckoId === undefined) {
        throw new Error(
          `Coingecko ID not found for token ${t.address.toString()}`,
        )
      }

      return {
        address: Address.getRawAddress(t.address),
        chainId,
        coingeckoId,
      }
    })
}
