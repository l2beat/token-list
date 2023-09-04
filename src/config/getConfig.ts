import { getEnv } from '@l2beat/backend-tools'

import { Config } from './Config'

export function getConfig(): Config {
  const env = getEnv()
  return {
    jsonRpc: {
      mainnetUrl: env.string('JSON_RPC_MAINNET_URL'),
      arbitrumUrl: env.string('JSON_RPC_ARBITRUM_URL'),
      optimismUrl: env.string('JSON_RPC_OPTIMISM_URL'),
    },
    etherscan: {
      mainnet: {
        apiUrl: 'https://api.etherscan.io/api',
        apiKey: env.string('ETHERSCAN_MAINNET_API_KEY'),
      },
      arbitrum: {
        apiUrl: 'https://api.arbiscan.io/api',
        apiKey: env.string('ETHERSCAN_ARBITRUM_API_KEY'),
      },
      optimism: {
        apiUrl: 'https://api-optimistic.etherscan.io/api',
        apiKey: env.string('ETHERSCAN_OPTIMISM_API_KEY'),
      },
    },
  }
}
