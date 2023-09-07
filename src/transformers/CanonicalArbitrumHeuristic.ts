import { TokenTransformer } from '../pipeline/TokenTransformer'
import { TokenListing } from '../TokenListing'

const ARB_RETRYABLE_TX = '0x000000000000000000000000000000000000006E'
const L2_ERC20_GATEWAY = '0x09e9222E96E7B4AE2a407B98d48e330053351EEe'

export class CanonicalArbitrumHeuristic implements TokenTransformer {
  transform(tokens: TokenListing[]): TokenListing[] {
    for (const token of tokens) {
      if (token.bridge?.name === 'Arbitrum') {
        delete token.bridge
      }

      delete token.tags?.arbitrumCanonical

      if (
        token.chain?.name === 'Arbitrum One' &&
        token.deployment?.contractName === 'ClonableBeaconProxy' &&
        (token.deployment?.to === ARB_RETRYABLE_TX ||
          token.deployment?.to === L2_ERC20_GATEWAY)
      ) {
        token.tags ??= {}
        token.tags.arbitrumCanonical = true

        token.bridge = {
          name: 'Arbitrum',
          sourceChain: { id: 1, name: 'Ethereum' },
        }
      }
    }
    return tokens
  }
}
