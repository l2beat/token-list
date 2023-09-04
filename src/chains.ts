export interface ChainInfo {
  id: number
  coingeckoId: string
  name: string
  prefix: string
}

export const chains: ChainInfo[] = [
  {
    id: 1,
    coingeckoId: 'ethereum',
    name: 'Ethereum',
    prefix: 'eth',
  },
  {
    id: 10,
    coingeckoId: 'optimistic-ethereum',
    name: 'OP Mainnet',
    prefix: 'op',
  },
  {
    id: 42161,
    coingeckoId: 'arbitrum-one',
    name: 'Arbitrum One',
    prefix: 'arb',
  },
  // {
  //   id: 1101,
  //   coingeckoId: 'polygon-zkevm',
  //   name: 'Polygon zkEVM',
  //   prefix: 'polygon-zkevm',
  // },
]

export function getChain(chainId: number) {
  const chain = chains.find((chain) => chain.id === chainId)
  if (!chain) {
    throw new Error(`Unknown chain id ${chainId}`)
  }
  return chain
}
