import { Chain } from 'viem'

export interface ChainConfig {
  name: string
  id: number
  tag: string
  prefix: string
  viemChain?: Chain
  coingeckoId?: string
  jsonRpcUrl?: string
  etherscanApiUrl?: string
  etherscanApiKey?: string
  axelarGateway?: `0x${string}`
}

export interface Config {
  tokenFile: string
  chains: ChainConfig[]
}
