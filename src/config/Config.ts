import { Chain } from 'viem'

export interface Config {
  tokenFile: string
  chains: ChainConfig[]
  tokenLists: TokenListConfig[]
  axelarListUrl: string
  wormholeListUrl: string
}

export interface ChainConfig {
  name: string
  id: number
  tag: string
  prefix: string
  viemChain?: Chain
  coingeckoId?: string
  axelarId?: string
  wormholeId?: string
  jsonRpcUrl?: string
  etherscanApiUrl?: string
  etherscanApiKey?: string
  skipDeploymentTransaction?: boolean
  axelarGateway?: `0x${string}`
}

export interface TokenListConfig {
  tag: string
  url: string
}
