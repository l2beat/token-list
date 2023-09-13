import { Logger } from '@l2beat/backend-tools'

import { Address } from '../Address'
import { TokenListing } from '../TokenListing'
import { CoingeckoRanker, RankedCoingeckoToken } from './CoingeckoRanker'
import { TotalSupplyChecker } from './TotalSupplyChecker'

export interface RankedToken {
  address: Address
  chain: string
  coingeckoId: string
  coingeckoRank: number
  totalSupply: number
  shareOfCirculating: number
  value: number
  bridge?: string
}

export class TokenRanker {
  constructor(
    private readonly coingeckoRanker: CoingeckoRanker,
    private readonly totalSupplyChecker: TotalSupplyChecker,
    private readonly logger: Logger,
  ) {
    this.logger = logger.for(this)
  }

  async getRanking(tokens: TokenListing[]): Promise<RankedToken[]> {
    const coingeckoRanking = await this.coingeckoRanker.getRanking()
    const idToRanking = new Map<string, RankedCoingeckoToken>()
    for (const token of coingeckoRanking) {
      idToRanking.set(token.coingeckoId, token)
    }
    const rankedTokens = tokens.filter((token) => {
      const coingeckoId = getCoingeckoId(token)
      return coingeckoId ? idToRanking.has(coingeckoId) : false
    })

    const totalSupplies = await this.totalSupplyChecker.checkTotalSupply(
      rankedTokens.map((token) => token.address),
    )

    const result = rankedTokens
      .map((token): RankedToken | undefined => {
        const decimals = token.onChainMetadata?.decimals
        const chain = token.chain?.name
        const totalSupply = totalSupplies.get(token.address)
        const coingeckoId = getCoingeckoId(token)
        const ranking = coingeckoId ? idToRanking.get(coingeckoId) : undefined
        if (
          !decimals ||
          !chain ||
          !totalSupply ||
          !coingeckoId ||
          !ranking ||
          !ranking.circulatingSupply ||
          !ranking.price
        ) {
          return undefined
        }
        const totalUnits = Number(totalSupply / 10n ** BigInt(decimals))
        const total = Math.min(totalUnits, ranking.circulatingSupply)
        return {
          address: token.address,
          chain,
          coingeckoId,
          coingeckoRank: ranking.rank,
          totalSupply: totalUnits,
          shareOfCirculating: Number(
            (totalUnits / ranking.circulatingSupply).toFixed(2),
          ),
          value: Math.round(ranking.price * total),
          bridge: token.bridge?.name,
        }
      })
      .filter((x): x is RankedToken => !!x)
      .sort((a, b) => b.value - a.value)

    this.logger.info('Ranked tokens', { count: result.length })
    return result
  }
}

function getCoingeckoId(token: TokenListing) {
  return (
    token.identifiers?.coingeckoId ?? token.identifiers?.wormholeCoingeckoId
  )
}
