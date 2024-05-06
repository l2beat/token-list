import { Logger } from '@l2beat/backend-tools'
import { getContract, parseAbiItem, PublicClient } from 'viem'

import { Address } from '../Address'
import { TokenSource } from '../pipeline/TokenSource'
import { TokenListing } from '../TokenListing'

const OPTIMISM_BRIDGE_3 = '0x4200000000000000000000000000000000000012'
const OVM_TOKEN_FACTORY = '0x2e985AcD6C8Fa033A4c5209b0140940E24da7C5C'

const abi = [parseAbiItem('function l1Token() external view returns (address)')]

export class CanonicalOptimismSource implements TokenSource {
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
      if (token.bridge?.name === 'Optimism') {
        delete token.bridge
      }
      delete token.tags?.optimismCanonical
    })

    const relevantTokens = knownTokens.filter(
      (token) =>
        token.chain?.name === 'OP Mainnet' &&
        (token.deployment?.to === OPTIMISM_BRIDGE_3 ||
          token.deployment?.to === OVM_TOKEN_FACTORY),
    )

    const results = await Promise.all(
      relevantTokens.map(async (token): Promise<TokenListing> => {
        const address = Address.getRawAddress(token.address)
        const contract = getContract({
          address,
          abi,
          publicClient: this.publicClient,
        })

        const l1AddressResult = await contract.read
          .l1Token()
          .catch(() => undefined)

        const l1Address = l1AddressResult
          ? Address(`eth:${l1AddressResult}`)
          : undefined

        token.tags ??= {}
        token.tags.optimismCanonical = true

        return {
          ...token,
          bridge: {
            name: 'Optimism',
            sourceToken: l1Address,
            sourceChain: { id: 1, name: 'Ethereum' },
          },
        }
      }),
    )

    this.logger.info('Got optimism canonical tokens', {
      length: results.length,
    })

    return results
  }
}
