import { Logger } from '@l2beat/backend-tools'
import { parseAbiItem, PublicClient } from 'viem'

import { Address } from '../Address'
import { getChain } from '../chains'
import { TokenSource } from '../pipeline/TokenSource'
import { TokenListing } from '../TokenListing'

export class AxelarSource implements TokenSource {
  constructor(
    private readonly client: PublicClient,
    private readonly chainId: number,
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

    const chain = getChain(this.chainId)
    return logs.map(
      (log): TokenListing => ({
        address: Address(`${chain.prefix}:${log.args.tokenAddresses}`),
        chain: { id: chain.id, name: chain.name },
        identifiers: { axelarId: log.args.symbol },
      }),
    )
  }
}
