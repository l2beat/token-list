import { Logger } from '@l2beat/backend-tools'

import { TokenTransformer } from '../pipeline/TokenTransformer'
import { TokenListing } from '../TokenListing'

export class AxelarHeuristic implements TokenTransformer {
  constructor(private readonly logger: Logger) {
    this.logger = logger.for(this)
  }

  transform(tokens: TokenListing[]): TokenListing[] {
    for (const token of tokens) {
      if (token.bridge?.name === 'Axelar') {
        delete token.bridge
      }

      if (!token.identifiers?.axelarSymbol) {
        continue
      }

      if (token.deployment?.contractName !== 'BurnableMintableCappedERC20') {
        continue
      }

      const sourceTokens = tokens.filter(
        (other) =>
          other.address !== token.address &&
          other.identifiers?.axelarSymbol &&
          (other.identifiers.axelarSymbol === token.identifiers?.axelarSymbol ||
            'axl'.concat(other.identifiers.axelarSymbol) ===
              token.identifiers?.axelarSymbol) &&
          other.chain?.id !== token.chain?.id &&
          other.deployment?.contractName !== 'BurnableMintableCappedERC20',
      )

      token.bridge = { name: 'Axelar' }
      token.tags ??= {}
      token.tags.iou = true

      const sourceToken = sourceTokens[0]
      if (sourceToken && sourceTokens.length === 1) {
        token.bridge.sourceToken = sourceToken.address
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
    }

    return tokens
  }
}
