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
    axelar: {
      mainnetGateway: '0x4F4495243837681061C4743b74B3eEdf548D56A5',
      arbitrumGateway: '0xe432150cce91c13a887f7D836923d5597adD8E31',
      optimismGateway: '0xe432150cce91c13a887f7D836923d5597adD8E31',
    },
  }
}
