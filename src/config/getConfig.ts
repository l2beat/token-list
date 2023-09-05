import { getEnv } from '@l2beat/backend-tools'
import {
  arbitrum,
  avalanche,
  base,
  celo,
  gnosis,
  linea,
  mainnet,
  optimism,
  polygon,
  polygonZkEvm,
} from 'viem/chains'

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
      {
        id: 43114,
        name: 'Avalanche C-Chain',
        tag: 'avalanche',
        prefix: 'avax',
        viemChain: avalanche,
        coingeckoId: 'avalanche',
        jsonRpcUrl: env.string('AVALANCHE_JSON_RPC_URL'),
        etherscanApiUrl: 'https://api.snowtrace.io/api',
        etherscanApiKey: env.string('AVALANCHE_ETHERSCAN_API_KEY'),
        axelarGateway: '0x5029C0EFf6C34351a0CEc334542cDb22c7928f78',
      },
      {
        id: 8453,
        name: 'Base',
        tag: 'base',
        prefix: 'base',
        viemChain: base,
        coingeckoId: 'base',
        jsonRpcUrl: env.string('BASE_JSON_RPC_URL'),
        etherscanApiUrl: 'https://api.basescan.org/api',
        etherscanApiKey: env.string('BASE_ETHERSCAN_API_KEY'),
        axelarGateway: '0xe432150cce91c13a887f7D836923d5597adD8E31',
      },
      {
        id: 137,
        name: 'Polygon POS',
        tag: 'polygon',
        prefix: 'polygon',
        viemChain: polygon,
        coingeckoId: 'polygon-pos',
        jsonRpcUrl: env.string('POLYGON_JSON_RPC_URL'),
        etherscanApiUrl: 'https://api.polygonscan.com/api',
        etherscanApiKey: env.string('POLYGON_ETHERSCAN_API_KEY'),
        axelarGateway: '0x6f015F16De9fC8791b234eF68D486d2bF203FBA8',
      },
      {
        id: 42220,
        name: 'Celo',
        tag: 'celo',
        prefix: 'celo',
        viemChain: celo,
        coingeckoId: 'celo',
        jsonRpcUrl: env.string('CELO_JSON_RPC_URL'),
        etherscanApiUrl: 'https://api.celoscan.io/api',
        etherscanApiKey: env.string('CELO_ETHERSCAN_API_KEY'),
        skipDeploymentTransaction: true,
        axelarGateway: '0xe432150cce91c13a887f7D836923d5597adD8E31',
      },
      {
        id: 59144,
        name: 'Linea',
        tag: 'linea',
        prefix: 'linea',
        viemChain: linea,
        coingeckoId: 'linea',
        jsonRpcUrl: env.string('LINEA_JSON_RPC_URL'),
        etherscanApiUrl: 'https://api.lineascan.build/api',
        etherscanApiKey: env.string('LINEA_ETHERSCAN_API_KEY'),
        axelarGateway: '0xe432150cce91c13a887f7D836923d5597adD8E31',
      },
      {
        id: 1101,
        name: 'Polygon zkEVM',
        tag: 'polygon-zkevm',
        prefix: 'polygon-zkevm',
        viemChain: polygonZkEvm,
        coingeckoId: 'polygon-zkevm',
        jsonRpcUrl: env.string('POLYGON_ZKEVM_JSON_RPC_URL'),
        etherscanApiUrl: 'https://api-zkevm.polygonscan.com/api',
        etherscanApiKey: env.string('POLYGON_ZKEVM_ETHERSCAN_API_KEY'),
      },
      {
        id: 100,
        name: 'Gnosis',
        tag: 'gnosis',
        prefix: 'gnosis',
        viemChain: gnosis,
        coingeckoId: 'xdai',
        jsonRpcUrl: env.string('GNOSIS_JSON_RPC_URL'),
        etherscanApiUrl: 'https://api.gnosisscan.io/api',
        etherscanApiKey: env.string('GNOSIS_ETHERSCAN_API_KEY'),
        skipDeploymentTransaction: true,
      },
      // bsc: https://api.bscscan.com/api
    ],
    tokenLists: [
      {
        tag: '1inch',
        url: 'https://tokens.1inch.eth.link',
      },
      {
        tag: 'aave',
        url: 'http://tokenlist.aave.eth.link',
      },
      {
        tag: 'mycrypto',
        url: 'https://uniswap.mycryptoapi.com/',
      },
      {
        tag: 'superchain',
        url: 'https://static.optimism.io/optimism.tokenlist.json',
      },
    ],
  }
}
