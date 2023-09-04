import { merge } from 'lodash'
import { z } from 'zod'

import { Address } from './Address'

const AddressType = z.string().refine(Address.isAddress).transform(Address)

export type Chain = z.infer<typeof Chain>
export const Chain = z
  .object({
    name: z.string(),
    id: z.number(),
  })
  .strict()

export type TokenListing = z.infer<typeof TokenListing>
export const TokenListing = z
  .object({
    address: AddressType,
    name: z.string().optional(),
    symbol: z.string().optional(),
    chain: Chain.optional(),
    onChainMetadata: z
      .object({
        name: z.string().optional(),
        symbol: z.string().optional(),
        decimals: z.number().optional(),
      })
      .strict()
      .optional(),
    deployment: z
      .object({
        isEOA: z.boolean().optional(),
        contractName: z.string().optional(),
        transactionHash: z.string().optional(),
        blockNumber: z.number().optional(),
        timestamp: z.string().datetime().optional(),
      })
      .strict()
      .optional(),
    identifiers: z
      .object({
        coingeckoId: z.string().optional(),
        coinmarketcapId: z.string().optional(),
        axelarId: z.string().optional(),
      })
      .strict()
      .optional(),
    bridge: z
      .object({
        name: z.string(),
        sourceChain: Chain.optional(),
        sourceEscrow: AddressType.optional(),
      })
      .strict()
      .optional(),
  })
  .strict()

export function mergeListings(listings: TokenListing[][]): TokenListing[] {
  const merged = new Map<Address, TokenListing>()
  for (const listing of listings.flat()) {
    const existing = merged.get(listing.address)
    if (existing) {
      merged.set(listing.address, merge(existing, listing))
    } else {
      merged.set(listing.address, listing)
    }
  }
  return [...merged.values()]
}
