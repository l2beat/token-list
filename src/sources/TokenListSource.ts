import { Logger } from '@l2beat/backend-tools'
import fetch from 'node-fetch'
import { getAddress } from 'viem'
import { z } from 'zod'

import { Address } from '../Address'
import { ChainConfig } from '../config/Config'
import { TokenSource } from '../pipeline/TokenSource'
import { TokenListing } from '../TokenListing'

export class TokenListSource implements TokenSource {
  constructor(
    private readonly url: string,
    private readonly tag: string,
    private readonly logger: Logger,
    private readonly chains: ChainConfig[],
  ) {
    this.logger = logger.for(this)
  }

  async getTokens(): Promise<TokenListing[]> {
    const res = await fetch(this.url)
    const json = await res.json()
    const tokenList = TokenList.parse(json)

    const result: TokenListing[] = []
    for (const token of tokenList.tokens) {
      const chain = this.chains.find((chain) => chain.id === token.chainId)
      if (!chain) {
        continue
      }

      const listing: TokenListing = {
        address: Address(`${chain.prefix}:${getAddress(token.address)}`),
        chain: {
          id: chain.id,
          name: chain.name,
        },
        identifiers: {
          [`${this.tag}TokenListName`]: token.name,
          [`${this.tag}TokenListSymbol`]: token.symbol,
        },
      }

      if (token.logoURI) {
        listing.images = { [`${this.tag}TokenList`]: token.logoURI }
      }

      result.push(listing)
    }

    this.logger.info('Got tokens', { length: result.length })

    return result
  }
}

const TokenInfo = z.strictObject({
  chainId: z.number(),
  address: z.string(),
  decimals: z.number(),
  name: z.string(),
  symbol: z.string(),
  logoURI: z.string().optional(),
  tags: z.array(z.string()).optional(),
  extensions: z.record(z.unknown()).optional(),
})

const TokenList = z.strictObject({
  name: z.string(),
  timestamp: z.string(),
  version: z.strictObject({
    major: z.number(),
    minor: z.number(),
    patch: z.number(),
  }),
  tokens: z.array(TokenInfo),
  tokenMap: z.record(TokenInfo).optional(),
  keywords: z.array(z.string()).optional(),
  tags: z
    .record(
      z.strictObject({
        name: z.string(),
        description: z.string(),
      }),
    )
    .optional(),
  logoURI: z.string().optional(),
})
