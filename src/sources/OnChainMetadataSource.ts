import { Logger } from '@l2beat/backend-tools'
import { getContract, parseAbiItem, PublicClient } from 'viem'

import { Address } from '../Address'
import { TokenListing } from '../TokenListing'

const abi = [
  parseAbiItem('function name() view returns (string)'),
  parseAbiItem('function symbol() view returns (string)'),
  parseAbiItem('function decimals() view returns (uint)'),
]

export class OnChainMetadataSource {
  constructor(
    private readonly publicClient: PublicClient,
    private readonly chainId: number,
    private readonly logger: Logger,
  ) {
    this.logger = logger.for(this)
  }

  async getTokens(
    knownTokens: readonly TokenListing[],
  ): Promise<TokenListing[]> {
    const relevantTokens = knownTokens.filter(
      (token) =>
        token.chain?.id === this.chainId && token.onChainMetadata === undefined,
    )

    const results = await Promise.all(
      relevantTokens.map(async (token): Promise<TokenListing> => {
        const address = Address.getRawAddress(token.address)
        const contract = getContract({
          address,
          abi,
          publicClient: this.publicClient,
        })

        const [nameResult, symbolResult, decimalsResult] =
          await Promise.allSettled([
            contract.read.name(),
            contract.read.symbol(),
            contract.read.decimals(),
          ])

        const name =
          nameResult.status === 'fulfilled' ? nameResult.value : undefined
        const symbol =
          symbolResult.status === 'fulfilled' ? symbolResult.value : undefined
        const decimals =
          decimalsResult.status === 'fulfilled'
            ? Number(decimalsResult.value)
            : undefined

        return {
          ...token,
          onChainMetadata: { name, symbol, decimals },
        }
      }),
    )

    this.logger.info('Got metadata', { length: results.length })

    return results
  }
}
