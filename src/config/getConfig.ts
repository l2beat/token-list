import { getEnv } from '@l2beat/backend-tools'

import { Config } from './Config'

export function getConfig(): Config {
  const env = getEnv()
  return {
    etherscan: {
      mainnet: {
        apiUrl: 'https://api.etherscan.io/api',
        apiKey: env.string('ETHERSCAN_MAINNET_API_KEY'),
      },
    },
  }
}
