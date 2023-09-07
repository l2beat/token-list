import { TokenTransformer } from '../pipeline/TokenTransformer'
import { TokenListing } from '../TokenListing'

const OPTIMISM_BRIDGE_3 = '0x4200000000000000000000000000000000000012'
const OVM_TOKEN_FACTORY = '0x2e985AcD6C8Fa033A4c5209b0140940E24da7C5C'

export class CanonicalOptimismHeuristic implements TokenTransformer {
  transform(tokens: TokenListing[]): TokenListing[] {
    for (const token of tokens) {
      if (token.bridge?.name === 'Optimism') {
        delete token.bridge
      }

      delete token.tags?.optimismCanonical

      if (
        token.chain?.name === 'OP Mainnet' &&
        (token.deployment?.to === OPTIMISM_BRIDGE_3 ||
          token.deployment?.to === OVM_TOKEN_FACTORY)
      ) {
        token.tags ??= {}
        token.tags.optimismCanonical = true

        token.bridge = {
          name: 'Optimism',
          sourceChain: { id: 1, name: 'Ethereum' },
        }
      }
    }
    return tokens
  }
}
