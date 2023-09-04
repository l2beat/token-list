import { Logger } from '@l2beat/backend-tools'
import fetch from 'node-fetch'
import { getAddress } from 'viem'
import { z } from 'zod'

import { Address } from '../Address'
import { TokenSource } from '../pipeline/TokenSource'
import { TokenListing } from '../TokenListing'

const URL = 'https://api.coingecko.com/api/v3/coins/list?include_platform=true'

export class CoingeckoSource implements TokenSource {
  constructor(private readonly logger: Logger) {
    this.logger = logger.for(this)
  }

  async getTokens(): Promise<TokenListing[]> {
    const res = await fetch(URL)
    const json = await res.json()
    const parsed = CoingeckoResponse.parse(json)

    const listings: TokenListing[] = []

    for (const token of parsed) {
      for (const platform of platforms) {
        const address = token.platforms?.[platform.id]
        if (address) {
          listings.push({
            address: Address(`${platform.chainPrefix}:${getAddress(address)}`),
            chain: { name: platform.chainName, id: platform.chainId },
            identifiers: { coingeckoId: token.id },
          })
        }
      }
    }

    this.logger.info('Got tokens', { length: listings.length })

    return listings
  }
}

const platforms = [
  {
    id: 'ethereum',
    chainPrefix: 'eth',
    chainName: 'Ethereum',
    chainId: 1,
  },
  {
    id: 'optimistic-ethereum',
    chainPrefix: 'op',
    chainName: 'OP Mainnet',
    chainId: 10,
  },
  {
    id: 'arbitrum-one',
    chainPrefix: 'arb',
    chainName: 'Arbitrum One',
    chainId: 42161,
  },
  {
    id: 'polygon-zkevm',
    chainPrefix: 'polygon-zkevm',
    chainName: 'Polygon zkEVM',
    chainId: 1101,
  },
]

const CoingeckoResponse = z.array(
  z.object({
    id: z.string(),
    symbol: z.string(),
    name: z.string(),
    platforms: z.record(z.union([z.string(), z.null()])).optional(),
  }),
)
