import { Logger } from '@l2beat/backend-tools'
import { getContract, parseAbiItem, PublicClient } from 'viem'

import { Address } from '../Address'
import { ChainConfig } from '../config/Config'

const abi = [parseAbiItem('function totalSupply() view returns (uint)')]

export class TotalSupplyChecker {
  constructor(
    private readonly clients: { chain: ChainConfig; client?: PublicClient }[],
    private readonly logger: Logger,
  ) {
    this.logger = logger.for(this)
  }

  async checkTotalSupply(tokens: Address[]): Promise<Map<Address, bigint>> {
    const results = new Map<Address, bigint>()
    await Promise.all(
      tokens.map(async (token) => {
        const prefix = Address.getPrefix(token)
        const client = this.clients.find((c) => c.chain.prefix === prefix)
          ?.client
        if (!client) {
          throw new Error(`No client for ${token.toString()}`)
        }
        const contract = getContract({
          address: Address.getRawAddress(token),
          abi,
          publicClient: client,
        })

        try {
          const totalSupply = await contract.read.totalSupply()
          results.set(token, totalSupply)
        } catch {
          return undefined
        }
      }),
    )
    this.logger.info('Got total supply info', { tokens: results.size })
    return results
  }
}
