import { Logger } from '@l2beat/backend-tools'
import fetch from 'node-fetch'
import { getAddress } from 'viem'
import { z } from 'zod'

import { Address } from '../Address'
import { ChainConfig } from '../config/Config'
import { TokenSource } from '../pipeline/TokenSource'
import { TokenListing } from '../TokenListing'

export class OrbitSource implements TokenSource {
  constructor(
    private readonly url: string,
    private readonly logger: Logger,
    private readonly chains: ChainConfig[],
  ) {
    this.logger = logger.for(this)
  }

  async getTokens(): Promise<TokenListing[]> {
    const res = await fetch(this.url)
    const data = await res.json()
    const parsed = OrbitResult.parse(data)

    const result: TokenListing[] = []

    for (const token of parsed.tokenList) {
      const sourceChain = this.chains.find(
        (chain) => chain.orbitId && chain.orbitId === token.chain,
      )
      let mainListing: TokenListing | undefined
      if (sourceChain) {
        mainListing = {
          address: Address(
            `${sourceChain.prefix}:${getAddress(token.address)}`,
          ),
          chain: { name: sourceChain.name, id: sourceChain.id },
          identifiers: {
            orbitSymbol: token.symbol,
          },
          tags: {
            orbit: true,
            orbitSource: true,
          },
        }
        for (const [orbitChain, minters] of Object.entries(token.minters)) {
          const chain = this.chains.find(
            (chain) => chain.orbitId && chain.orbitId === orbitChain,
          )
          if (chain) {
            for (const minter of minters) {
              if (minter.asOrigin) {
                continue
              }
              result.push({
                address: Address(
                  `${chain.prefix}:${getAddress(minter.address)}`,
                ),
                chain: { name: chain.name, id: chain.id },
                identifiers: {
                  orbitSymbol: minter.symbol,
                },
                tags: {
                  orbit: true,
                  orbitDestination: true,
                },
                bridge: {
                  name: 'Orbit',
                  sourceChain: mainListing.chain,
                  sourceChainRaw: token.chain,
                  sourceEscrow:
                    sourceChain &&
                    Address(`${sourceChain.prefix}:${getAddress(token.vault)}`),
                  sourceEscrowRaw: token.vault,
                  sourceToken: mainListing.address,
                  sourceTokenRaw: token.address,
                },
              })
            }
          }
        }
      }
    }

    this.logger.info('Got tokens', { length: result.length })

    return result
  }
}

const OrbitResult = z.object({
  success: z.boolean(),
  tokenList: z.array(
    z.object({
      symbol: z.string(),
      decimals: z.number(),
      governance: z.string(),
      vault: z.string(),
      chain: z.string(),
      address: z.string(),
      minters: z.record(
        z.array(
          z.object({
            address: z.string(),
            minter: z.string().optional(),
            symbol: z.string(),
            mintable: z.boolean(),
            asOrigin: z.boolean(),
          }),
        ),
      ),
    }),
  ),
  nftTokenList: z.array(z.unknown()),
  validators: z.record(
    z.object({
      validators: z.record(z.string()),
      chains: z.array(z.string()),
      chain: z.string(),
    }),
  ),
})
