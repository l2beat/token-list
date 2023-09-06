import { Chain } from 'viem'

export interface AxelarConfigConfig {
  url: string
}

export interface Config {
  tokenFile: string
  chains: ChainConfig[]
  tokenLists: TokenListConfig[]
  axelarConfig: AxelarConfigConfig
}

export interface ChainConfig {
  name: string
  id: number
  tag: string
  prefix: string
  viemChain?: Chain
  coingeckoId?: string
  axelarId?: string
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
