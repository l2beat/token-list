import { Logger } from '@l2beat/backend-tools'

import { TokenSource } from '../pipeline/TokenSource'
import { TokenListing } from '../TokenListing'

export class AxelarHeuristicSource implements TokenSource {
  constructor(private readonly logger: Logger) {
    this.logger = logger.for(this)
  }

  async getTokens(
    knownTokens: readonly TokenListing[],
  ): Promise<TokenListing[]> {
    const fromAxelar = knownTokens.filter(
      (token) => token.identifiers?.axelarSymbol,
    )

    const results: TokenListing[] = []
    for (const token of fromAxelar) {
      if (token.deployment?.contractName === 'BurnableMintableCappedERC20') {
        const sourceTokens = knownTokens.filter(
          (other) =>
            other.address !== token.address &&
            other.identifiers?.axelarSymbol &&
            (other.identifiers.axelarSymbol ===
              token.identifiers?.axelarSymbol ||
              'axl'.concat(other.identifiers.axelarSymbol) ===
                token.identifiers?.axelarSymbol) &&
            other.chain?.id !== token.chain?.id &&
            other.deployment?.contractName !== 'BurnableMintableCappedERC20',
        )

        const listing: TokenListing = {
          ...token,
          bridge: { name: 'Axelar' },
          tags: ['iou'],
        }

        const sourceToken = sourceTokens[0]
        if (sourceToken && listing.bridge) {
          listing.bridge.sourceToken = sourceToken.address
        }

        if (sourceTokens.length === 0) {
          this.logger.warn('Missing source token', {
            address: token.address,
            axelarSymbol: token.identifiers?.axelarSymbol,
          })
        }

        if (sourceTokens.length > 1) {
          this.logger.error('Too many source tokens', {
            address: token.address,
            axelarSymbol: token.identifiers?.axelarSymbol,
            sourceTokens: sourceTokens.map((token) => token.address),
          })
        }

        results.push(listing)
      }
    }

    return Promise.resolve(results)
  }
}
