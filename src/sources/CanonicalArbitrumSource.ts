import { Logger } from '@l2beat/backend-tools'
import { getContract, parseAbiItem, PublicClient } from 'viem'

import { Address } from '../Address'
import { TokenSource } from '../pipeline/TokenSource'
import { TokenListing } from '../TokenListing'

const ARB_RETRYABLE_TX = '0x000000000000000000000000000000000000006E'
const L2_ERC20_GATEWAY = '0x09e9222E96E7B4AE2a407B98d48e330053351EEe'

const abi = [
  parseAbiItem('function l1Address() external view returns (address)'),
]

export class CanonicalArbitrumSource implements TokenSource {
  constructor(
    private readonly publicClient: PublicClient,
    private readonly logger: Logger,
  ) {
    this.logger = logger.for(this)
  }

  async getTokens(
    knownTokens: readonly TokenListing[],
  ): Promise<TokenListing[]> {
    knownTokens.forEach((token) => {
      if (token.bridge?.name === 'Arbitrum') {
        delete token.bridge
      }
      delete token.tags?.arbitrumCanonical
    })

    const relevantTokens = knownTokens.filter(
      (token) =>
        token.chain?.name === 'Arbitrum One' &&
        token.deployment?.contractName === 'ClonableBeaconProxy' &&
        (token.deployment?.to === ARB_RETRYABLE_TX ||
          token.deployment?.to === L2_ERC20_GATEWAY),
    )

    const results = await Promise.all(
      relevantTokens.map(async (token): Promise<TokenListing> => {
        const address = Address.getRawAddress(token.address)
        const contract = getContract({
          address,
          abi,
          publicClient: this.publicClient,
        })

        const [l1AddressResult] = await Promise.allSettled([
          contract.read.l1Address(),
        ])

        const l1Address =
          l1AddressResult.status === 'fulfilled'
            ? Address(`eth:${l1AddressResult.value}`)
            : undefined

        token.tags ??= {}
        token.tags.arbitrumCanonical = true

        return {
          ...token,
          bridge: {
            sourceToken: l1Address,
            sourceChain: { id: 1, name: 'Ethereum' },
            name: 'Arbitrum',
          },
        }
      }),
    )

    this.logger.info('Got arbitrum canonical tokens', {
      length: results.length,
    })

    return results
  }
}
