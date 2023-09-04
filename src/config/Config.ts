export interface Config {
  jsonRpc: {
    mainnetUrl: string
    arbitrumUrl: string
    optimismUrl: string
  }
  etherscan: {
    mainnet: {
      apiUrl: string
      apiKey: string
    }
    arbitrum: {
      apiUrl: string
      apiKey: string
    }
    optimism: {
      apiUrl: string
      apiKey: string
    }
  }
}
