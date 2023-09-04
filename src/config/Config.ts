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
  axelar: {
    mainnetGateway: `0x${string}`
    arbitrumGateway: `0x${string}`
    optimismGateway: `0x${string}`
  }
}
