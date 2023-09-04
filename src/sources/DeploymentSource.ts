import fetch from 'node-fetch'
import { PublicClient } from 'viem'
import { z } from 'zod'

import { Address } from '../Address'
import { TokenListing } from '../TokenListing'
import { Logger } from '@l2beat/backend-tools'

export class DeploymentSource {
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
    private readonly publicClient: PublicClient,
    private readonly chainId: number,
    private logger: Logger,
  ) {
    this.logger = logger.for(this)
  }

  async getTokens(
    knownTokens: readonly TokenListing[],
  ): Promise<TokenListing[]> {
    const relevantTokens = knownTokens.filter(
      (token) =>
        token.chain?.id === this.chainId &&
        token.contract === undefined &&
        token.deployment === undefined,
    )

    if (relevantTokens.length > 10) {
      this.logger.info('Too many tokens', { length: relevantTokens.length })
      relevantTokens.length = 10
    }

    const results: TokenListing[] = []
    for (const token of relevantTokens) {
      // we don't use Promise.all to not overload etherscan
      const source = await this.getContractSource(token.address)
      const deployment = await this.getContractDeployment(token.address)
      const tx = await this.publicClient.getTransaction({
        hash: deployment.txHash as `0x${string}`,
      })
      const block = await this.publicClient.getBlock({
        blockNumber: tx.blockNumber,
      })

      this.logger.info('Got metadata', { address: token.address })

      results.push({
        ...token,
        contract: {
          name: source.ContractName,
        },
        deployment: {
          transactionHash: deployment.txHash,
          blockNumber: Number(tx.blockNumber),
          timestamp: Number(block.timestamp),
        },
      })
    }

    return results
  }

  async getContractSource(address: Address) {
    const response = await this.call('contract', 'getsourcecode', {
      address: Address.getRawAddress(address),
    })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return GetSourceCodeResult.parse(response)[0]!
  }

  async getContractDeployment(address: Address) {
    const response = await this.call('contract', 'getcontractcreation', {
      contractaddresses: Address.getRawAddress(address),
    })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return GetContractCreationResult.parse(response)[0]!
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

    if (response.message !== 'OK') {
      throw new Error(response.result)
    }

    return response.result
  }
}

export type EtherscanSuccessResponse = z.infer<typeof EtherscanSuccessResponse>
const EtherscanSuccessResponse = z.object({
  message: z.literal('OK'),
  result: z.unknown(),
})

export type EtherscanErrorResponse = z.infer<typeof EtherscanErrorResponse>
const EtherscanErrorResponse = z.object({
  message: z.literal('NOTOK'),
  result: z.string(),
})

export type EtherscanResponse = z.infer<typeof EtherscanResponse>
const EtherscanResponse = z.union([
  EtherscanSuccessResponse,
  EtherscanErrorResponse,
])

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
