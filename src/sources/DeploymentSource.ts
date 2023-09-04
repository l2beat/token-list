import { Logger } from '@l2beat/backend-tools'
import fetch from 'node-fetch'
import { setTimeout } from 'timers/promises'
import { PublicClient } from 'viem'
import { z } from 'zod'

import { Address } from '../Address'
import { Cache } from '../cache/Cache'
import { TokenListing } from '../TokenListing'

type Deployment = TokenListing['deployment']

export class DeploymentSource {
  private readonly cache: Cache<Deployment>

  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
    private readonly publicClient: PublicClient,
    private readonly chainId: number,
    private readonly logger: Logger,
  ) {
    this.logger = logger.for(this)
    this.cache = new Cache<Deployment>(`deployments-${chainId}.json`)
  }

  async getTokens(
    knownTokens: readonly TokenListing[],
  ): Promise<TokenListing[]> {
    const relevantTokens = knownTokens.filter(
      (token) =>
        token.chain?.id === this.chainId && token.deployment === undefined,
    )

    const results: TokenListing[] = []
    for (const [i, token] of relevantTokens.entries()) {
      // we don't use Promise.all to not overload etherscan

      const address = Address.getRawAddress(token.address)
      const { deployment, isCached } = await this.getCachedDeployment(address)

      if (!isCached) {
        this.logger.info('Got metadata', {
          index: i,
          total: relevantTokens.length,
          address: token.address,
        })
      }

      results.push({
        ...token,
        deployment,
      })
    }

    return results
  }

  private async getCachedDeployment(address: `0x${string}`) {
    const cached = this.cache.get(address)
    if (cached) {
      return { deployment: cached, isCached: true }
    }
    while (true) {
      try {
        const deployment = await this.getDeployment(address)
        this.cache.set(address, deployment)
        return { deployment, isCached: false }
      } catch (e) {
        this.logger.error('Failed to get deployment', e)
        await setTimeout(5_000)
      }
    }
  }

  private async getDeployment(address: `0x${string}`): Promise<Deployment> {
    const source = await this.getContractSource(address)
    const deployment = await this.getContractDeployment(address)

    const tx =
      deployment &&
      (await this.publicClient.getTransaction({
        hash: deployment.txHash as `0x${string}`,
      }))
    const block =
      tx &&
      (await this.publicClient.getBlock({
        blockNumber: tx.blockNumber,
      }))

    return {
      isEOA: !deployment,
      contractName: source?.ContractName ? source.ContractName : undefined,
      transactionHash: deployment?.txHash,
      blockNumber: tx && Number(tx.blockNumber),
      timestamp:
        block && new Date(Number(block.timestamp) * 1000).toISOString(),
    }
  }

  async getContractSource(address: `0x${string}`) {
    const response = await this.call('contract', 'getsourcecode', { address })
    if (response.message === 'No data found') {
      return undefined
    }
    if (response.message !== 'OK') {
      throw new Error(`Unexpected response: ${response.message}`)
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return GetSourceCodeResult.parse(response.result)[0]!
  }

  async getContractDeployment(address: `0x${string}`) {
    const response = await this.call('contract', 'getcontractcreation', {
      contractaddresses: address,
    })
    if (response.message === 'No data found') {
      return undefined
    }
    if (response.message !== 'OK') {
      console.log(address)
      throw new Error(`Unexpected response: ${response.message}`)
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return GetContractCreationResult.parse(response.result)[0]!
  }

  async call(module: string, action: string, params: Record<string, string>) {
    const query = new URLSearchParams({
      module,
      action,
      ...params,
      apikey: this.apiKey,
    })
    const url = `${this.apiUrl}?${query.toString()}`

    const res = await fetch(url)
    const json = await res.json()
    const response = EtherscanResponse.parse(json)

    return response
  }
}

export type EtherscanResponse = z.infer<typeof EtherscanResponse>
const EtherscanResponse = z.object({
  message: z.string(),
  result: z.unknown().optional(),
})

export type ContractSource = z.infer<typeof ContractSource>
export const ContractSource = z.object({
  SourceCode: z.string(),
  ABI: z.string(),
  ContractName: z.string(),
  CompilerVersion: z.string(),
  OptimizationUsed: z.string(),
  Runs: z.string(),
  ConstructorArguments: z.string(),
  EVMVersion: z.string(),
  Library: z.string(),
  LicenseType: z.string(),
  Proxy: z.string(),
  Implementation: z.string(),
  SwarmSource: z.string(),
})

export const GetSourceCodeResult = z.array(ContractSource).length(1)

export type ContractCreatorAndCreationTxHash = z.infer<
  typeof ContractCreatorAndCreationTxHash
>
export const ContractCreatorAndCreationTxHash = z.object({
  contractAddress: z.string(),
  contractCreator: z.string(),
  txHash: z.string(),
})

export const GetContractCreationResult = z
  .array(ContractCreatorAndCreationTxHash)
  .length(1)
