import { Logger } from '@l2beat/backend-tools'
import { createPublicClient, http, PublicClient } from 'viem'

import { ChainConfig, Config } from './config/Config'
import { AxelarGatewaySource } from './sources/AxelarGatewaySource'
import { DeploymentSource } from './sources/DeploymentSource'
import { OnChainMetadataSource } from './sources/OnChainMetadataSource'

interface ChainSource {
  chain: ChainConfig
  client?: PublicClient
  axelarSource?: AxelarGatewaySource
  onChainMetadataSource?: OnChainMetadataSource
  deploymentSource?: DeploymentSource
}

export function getChainSources(config: Config, logger: Logger): ChainSource[] {
  return config.chains.map((chain) => {
    let client: PublicClient | undefined
    let axelarSource: AxelarGatewaySource | undefined
    let onChainMetadataSource: OnChainMetadataSource | undefined
    let deploymentSource: DeploymentSource | undefined

    if (chain.jsonRpcUrl) {
      client = createPublicClient({
        chain: chain.viemChain,
        transport: http(chain.jsonRpcUrl),
        batch: {
          multicall: true,
        },
      })
    }

    if (client && chain.axelarGateway) {
      axelarSource = new AxelarGatewaySource(
        client,
        chain,
        chain.axelarGateway,
        logger.tag(chain.tag),
      )
    }

    if (client) {
      onChainMetadataSource = new OnChainMetadataSource(
        client,
        chain.id,
        logger.tag(chain.tag),
      )
    }

    if (client && chain.etherscanApiUrl && chain.etherscanApiKey) {
      deploymentSource = new DeploymentSource(
        chain.etherscanApiUrl,
        chain.etherscanApiKey,
        !!chain.skipDeploymentTransaction,
        client,
        chain.id,
        logger.tag(chain.tag),
      )
    }

    return {
      chain,
      client,
      axelarSource,
      onChainMetadataSource,
      deploymentSource,
    }
  })
}
