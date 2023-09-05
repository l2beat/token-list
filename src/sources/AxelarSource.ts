import { Logger } from '@l2beat/backend-tools'
import { parseAbiItem, PublicClient } from 'viem'

import { Address } from '../Address'
import { ChainConfig } from '../config/Config'
import { TokenSource } from '../pipeline/TokenSource'
import { TokenListing } from '../TokenListing'

export class AxelarSource implements TokenSource {
  constructor(
    private readonly client: PublicClient,
    private readonly chain: Pick<ChainConfig, 'id' | 'prefix' | 'name'>,
    private readonly gatewayAddress: `0x${string}`,
    private readonly logger: Logger,
  ) {
    this.logger = logger.for(this)
  }

  async getTokens(): Promise<TokenListing[]> {
    const logs = await this.client.getLogs({
      event: parseAbiItem(
        'event TokenDeployed(string symbol, address tokenAddresses)',
      ),
      address: this.gatewayAddress,
      fromBlock: 0n,
      toBlock: 'latest',
    })

    this.logger.info('Got logs', { length: logs.length })

    return logs.map((log): TokenListing => {
      const listing: TokenListing = {
        address: Address(`${this.chain.prefix}:${log.args.tokenAddresses}`),
        chain: { id: this.chain.id, name: this.chain.name },
      }
      if (log.args.symbol) {
        listing.identifiers = { axelarSymbol: log.args.symbol }
      }
      return listing
    })
  }
}
