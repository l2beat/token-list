import { Logger } from '@l2beat/backend-tools'
import fetch from 'node-fetch'
import Papa from 'papaparse'
import { getAddress } from 'viem'
import { z } from 'zod'

import { Address } from '../Address'
import { ChainConfig } from '../config/Config'
import { TokenSource } from '../pipeline/TokenSource'
import { TokenListing } from '../TokenListing'

export class WormholeSource implements TokenSource {
  constructor(
    private readonly url: string,
    private readonly logger: Logger,
    private readonly chains: ChainConfig[],
  ) {
    this.logger = logger.for(this)
  }

  async getTokens(): Promise<TokenListing[]> {
    const res = await fetch(this.url)
    const data = await res.text()
    const rawParsed = Papa.parse(data, {
      header: true,
      skipEmptyLines: true,
    }).data
    const parsed = z.array(WormholeToken).parse(rawParsed)
    const normalized = parsed.map((token) => {
      const entry = {
        chain: token.source,
        symbol: token.symbol,
        name: token.name,
        address: token.sourceAddress,
        coingeckoId: token.coingeckoId,
        logo: token.logo,
        chains: [] as { chain: string; address: string }[],
      }
      for (const [key, value] of Object.entries(token)) {
        if (key.endsWith('Address') && value) {
          entry.chains.push({
            chain: key.slice(0, -'Address'.length),
            address: value,
          })
        }
      }
      return entry
    })

    const listings: TokenListing[] = []
    for (const token of normalized) {
      let identifiers: TokenListing['identifiers']
      if (token.coingeckoId) {
        identifiers ??= {}
        identifiers.wormholeCoingeckoId = token.coingeckoId
      }
      if (token.name) {
        identifiers ??= {}
        identifiers.wormholeName = token.name
      }
      if (token.symbol) {
        identifiers ??= {}
        identifiers.wormholeSymbol = token.symbol
      }

      let images: TokenListing['images']
      if (token.logo) {
        images = { wormhole: token.logo }
      }

      const sourceChain = this.chains.find(
        (chain) => chain.wormholeId && chain.wormholeId === token.chain,
      )
      let mainListing: TokenListing | undefined
      if (sourceChain) {
        mainListing = {
          address: Address(
            `${sourceChain.prefix}:${getAddress(token.address)}`,
          ),
          identifiers,
          images,
          tags: {
            wormhole: true,
            wormholeSource: true,
          },
        }
        listings.push(mainListing)
      }

      for (const wrapped of token.chains) {
        const destinationChain = this.chains.find(
          (chain) => chain.wormholeId && chain.wormholeId === wrapped.chain,
        )
        if (destinationChain) {
          listings.push({
            address: Address(
              `${destinationChain.prefix}:${getAddress(wrapped.address)}`,
            ),
            identifiers,
            images,
            tags: {
              wormhole: true,
              wormholeDestination: true,
            },
            bridge: {
              name: 'Wormhole',
              sourceChain: sourceChain && {
                name: sourceChain.name,
                id: sourceChain.id,
              },
              sourceChainRaw: token.chain,
              sourceToken: mainListing && mainListing.address,
              sourceTokenRaw: token.address,
            },
          })
        }
      }
    }

    return listings
  }
}

const WormholeToken = z.object({
  source: z.string(),
  symbol: z.string(),
  name: z.string(),
  sourceAddress: z.string(),
  sourceDecimals: z.string(),
  coingeckoId: z.string(),
  logo: z.string(),
  solAddress: z.string(),
  solDecimals: z.string(),
  ethAddress: z.string(),
  ethDecimals: z.string(),
  bscAddress: z.string(),
  bscDecimals: z.string(),
  terraAddress: z.string(),
  terraDecimals: z.string(),
  maticAddress: z.string(),
  maticDecimals: z.string(),
  avaxAddress: z.string(),
  avaxDecimals: z.string(),
  oasisAddress: z.string(),
  oasisDecimals: z.string(),
  algorandAddress: z.string(),
  algorandDecimals: z.string(),
  ftmAddress: z.string(),
  ftmDecimals: z.string(),
  auroraAddress: z.string(),
  auroraDecimals: z.string(),
  karuraAddress: z.string(),
  karuraDecimals: z.string(),
  acalaAddress: z.string(),
  acalaDecimals: z.string(),
  klaytnAddress: z.string(),
  klaytnDecimals: z.string(),
  celoAddress: z.string(),
  celoDecimals: z.string(),
  nearAddress: z.string(),
  nearDecimals: z.string(),
  moonbeamAddress: z.string(),
  moonbeamDecimals: z.string(),
  terra2Address: z.string(),
  terra2Decimals: z.string(),
  injectiveAddress: z.string(),
  injectiveDecimals: z.string(),
  xplaAddress: z.string(),
  xplaDecimals: z.string(),
  optimismAddress: z.string(),
  optimismDecimals: z.string(),
  arbitrumAddress: z.string(),
  arbitrumDecimals: z.string(),
  aptosAddress: z.string(),
  aptosDecimals: z.string(),
  baseAddress: z.string(),
  baseDecimals: z.string(),
})
