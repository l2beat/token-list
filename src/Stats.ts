import { Logger } from '@l2beat/backend-tools'

import { ChainConfig } from './config/Config'
import { TokenListing } from './TokenListing'

export class Stats {
  constructor(
    private readonly logger: Logger,
    private readonly chains: ChainConfig[],
  ) {
    this.logger = logger.for(this)
  }

  outputStats(tokens: TokenListing[]) {
    const stats: Record<string, unknown> = {}

    stats.tokens = tokens.length

    const byChain: Record<string, unknown> = {}
    for (const chain of this.chains) {
      const chainTokens = count(tokens, (token) => token.chain?.id === chain.id)
      byChain[chain.tag] = chainTokens
    }
    stats.byChain = byChain

    const bridges = new Set<string>()
    for (const token of tokens) {
      if (token.bridge?.name) {
        bridges.add(token.bridge.name)
      }
    }
    const byBridge: Record<string, unknown> = {}
    for (const bridge of bridges) {
      const bridgeTokens = count(
        tokens,
        (token) => token.bridge?.name === bridge,
      )
      byBridge[bridge] = bridgeTokens
    }
    stats.byBridge = byBridge

    stats.withImages = count(tokens, (token) => !!token.images)
    stats.eoas = count(tokens, (token) => !!token.deployment?.isEOA)
    const currentYear = new Date().getFullYear().toString()
    stats[`from${currentYear}`] = count(
      tokens,
      (token) => !!token.deployment?.timestamp?.startsWith(currentYear),
    )

    this.logger.info('Stats', stats)
  }
}

function count<T>(items: T[], predicate: (item: T) => boolean) {
  let count = 0
  for (const item of items) {
    if (predicate(item)) {
      count++
    }
  }
  return { count, percentage: formatPercentage(count / items.length) }
}

function formatPercentage(percentage: number) {
  if (percentage < 0.0001 && percentage > 0) {
    return '<0.01%'
  }
  return `${(percentage * 100).toFixed(2)}%`
}
