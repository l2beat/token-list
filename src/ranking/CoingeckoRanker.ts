import { Logger } from '@l2beat/backend-tools'
import fetch from 'node-fetch'
import { setTimeout } from 'timers/promises'
import { z } from 'zod'

const URL = 'https://api.coingecko.com/api/v3/coins/markets'

export interface RankedCoingeckoToken {
  rank: number
  coingeckoId: string
  price?: number
  circulatingSupply?: number
}

export class CoingeckoRanker {
  constructor(private readonly logger: Logger) {
    this.logger = logger.for(this)
  }

  async getRanking(): Promise<RankedCoingeckoToken[]> {
    const perPage = 250
    const totalPages = 2_000 / perPage
    const results: RankedCoingeckoToken[] = []
    for (let i = 1; i <= totalPages; i++) {
      while (true) {
        try {
          const page = await this.getRankingPage(i, perPage)
          results.push(...page)
          this.logger.info('Got page', { page: i, total: results.length })
          break
        } catch (e) {
          if (e instanceof Error && e.message === 'Rate limited') {
            this.logger.warn('Rate limited, waiting')
            await setTimeout(5_000)
          } else {
            throw e
          }
        }
      }
    }
    return results
  }

  private async getRankingPage(
    page: number,
    perPage: number,
  ): Promise<RankedCoingeckoToken[]> {
    const options = new URLSearchParams({
      vs_currency: 'usd',
      per_page: perPage.toString(),
      page: page.toString(),
      order: 'market_cap_desc',
      sparkline: 'false',
      locale: 'en',
    })
    const res = await fetch(`${URL}?${options.toString()}`)
    if (!res.ok && res.status === 429) {
      throw new Error('Rate limited')
    }
    const json = await res.json()
    const parsed = CoingeckoResponse.parse(json)

    return parsed.map((token) => ({
      rank: token.market_cap_rank,
      coingeckoId: token.id,
      price: token.current_price ?? undefined,
      circulatingSupply: token.circulating_supply ?? undefined,
    }))
  }
}

const CoingeckoResponse = z.array(
  z.object({
    id: z.string(),
    current_price: z.union([z.number(), z.null()]),
    market_cap: z.number(),
    market_cap_rank: z.number(),
    circulating_supply: z.union([z.number(), z.null()]),
    total_supply: z.union([z.number(), z.null()]),
    // There are more items here but we don't care about them
  }),
)
