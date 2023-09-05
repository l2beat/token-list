import { getEnv } from '@l2beat/backend-tools'
import { arbitrum, mainnet, optimism } from 'viem/chains'

import { Config } from './Config'

export function getConfig(): Config {
  const env = getEnv()
  return {
    tokenFile: 'tokens.json',
    chains: [
      {
        id: 1,
        name: 'Ethereum',
        tag: 'ethereum',
        prefix: 'eth',
        viemChain: mainnet,
        coingeckoId: 'ethereum',
        jsonRpcUrl: env.string('ETHEREUM_JSON_RPC_URL'),
        etherscanApiUrl: 'https://api.etherscan.io/api',
        etherscanApiKey: env.string('ETHEREUM_ETHERSCAN_API_KEY'),
        axelarGateway: '0x4F4495243837681061C4743b74B3eEdf548D56A5',
      },
      {
        id: 42161,
        name: 'Arbitrum One',
        tag: 'arbitrum',
        prefix: 'arb',
        viemChain: arbitrum,
        coingeckoId: 'arbitrum-one',
        jsonRpcUrl: env.string('ARBITRUM_JSON_RPC_URL'),
        etherscanApiUrl: 'https://api.arbiscan.io/api',
        etherscanApiKey: env.string('ARBITRUM_ETHERSCAN_API_KEY'),
        axelarGateway: '0xe432150cce91c13a887f7D836923d5597adD8E31',
      },
      {
        id: 10,
        name: 'OP Mainnet',
        tag: 'optimism',
        prefix: 'op',
        viemChain: optimism,
        coingeckoId: 'optimistic-ethereum',
        jsonRpcUrl: env.string('OPTIMISM_JSON_RPC_URL'),
        etherscanApiUrl: 'https://api-optimistic.etherscan.io/api',
        etherscanApiKey: env.string('OPTIMISM_ETHERSCAN_API_KEY'),
        axelarGateway: '0xe432150cce91c13a887f7D836923d5597adD8E31',
      },
    ],
  }
}
