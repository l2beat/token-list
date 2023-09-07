import { Logger } from '@l2beat/backend-tools'

import { Address } from '../Address'
import { ChainConfig } from '../config/Config'
import { TokenTransformer } from '../pipeline/TokenTransformer'
import { TokenListing } from '../TokenListing'

export class ChainTransformer implements TokenTransformer {
  constructor(
    private readonly logger: Logger,
    private readonly chains: ChainConfig[],
  ) {
    this.logger = logger.for(this)
  }

  transform(tokens: TokenListing[]): TokenListing[] {
    for (const token of tokens) {
      const prefix = Address.getPrefix(token.address)
      const chain = this.chains.find((chain) => chain.prefix === prefix)
      if (!chain) {
        this.logger.error('Missing chain', { address: token.address })
        continue
      }
      token.chain = { id: chain.id, name: chain.name }
    }
    return tokens
  }
}
