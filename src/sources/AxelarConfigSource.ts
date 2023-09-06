import { Logger } from '@l2beat/backend-tools'
import fetch from 'node-fetch'
import { getAddress } from 'viem'
import { z } from 'zod'

import { Address } from '../Address'
import { AxelarConfigConfig, ChainConfig } from '../config/Config'
import { TokenSource } from '../pipeline/TokenSource'
import { TokenListing } from '../TokenListing'

export class AxelarConfigSource implements TokenSource {
  constructor(
    private readonly logger: Logger,
    private readonly config: AxelarConfigConfig,
    private readonly chains: ChainConfig[],
  ) {
    this.logger = logger.for(this)
  }

  async getTokens(): Promise<TokenListing[]> {
    const res = await fetch(this.config.url)
    const data = await res.json()
    const parsed = ConfigResponse.parse(data)

    const result: TokenListing[] = []

    for (const definition of Object.values(parsed)) {
      const sourceChain = this.chains.find(
        (c) => c.axelarId === definition.native_chain,
      )
      const sourceToken = definition.chain_aliases[definition.native_chain]

      for (const [chain, token] of Object.entries(definition.chain_aliases)) {
        const chainConfig = this.chains.find((c) => c.axelarId === chain)
        if (!chainConfig) {
          continue
        }

        const listing: TokenListing = {
          address: Address(
            `${chainConfig.prefix}:${getAddress(token.tokenAddress)}`,
          ),
          identifiers: {
            axelarId: definition.id,
          },
        }
        listing.tags = {
          axelar: true,
        }

        if (chain === definition.native_chain) {
          listing.tags.axelarNative = true
        } else {
          listing.tags.axelarBridged = true
          listing.bridge = {
            name: 'Axelar',
            sourceChain: sourceChain && {
              id: sourceChain.id,
              name: sourceChain.name,
            },
            sourceChainRaw: definition.native_chain,
            sourceToken:
              sourceChain &&
              sourceToken &&
              Address(
                `${sourceChain.prefix}:${getAddress(sourceToken.tokenAddress)}`,
              ),
            sourceTokenRaw: sourceToken?.tokenAddress,
          }
        }

        result.push(listing)
      }
    }

    return result
  }
}

const TokenChainConfig = z.object({
  assetSymbol: z.string(),
  assetName: z.string(),
  minDepositAmt: z.number(),
  ibcDenom: z.string(),
  fullDenomPath: z.string(),
  tokenAddress: z.string(),
  mintLimit: z.number(),
})

const TokenDefinition = z.object({
  id: z.string(),
  common_key: z.object({
    devnet: z.string(),
    testnet: z.string(),
    mainnet: z.string(),
  }),
  native_chain: z.string(),
  fully_supported: z.boolean(),
  decimals: z.number(),
  wrapped_erc20: z.string(),
  is_gas_token: z.boolean(),
  gas_token_id: z.string(),
  chain_aliases: z.record(TokenChainConfig),
})

const ConfigResponse = z.record(TokenDefinition)
