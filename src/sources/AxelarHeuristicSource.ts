import { TokenSource } from '../pipeline/TokenSource'
import { TokenListing } from '../TokenListing'

export class AxelarHeuristicSource implements TokenSource {
  async getTokens(
    knownTokens: readonly TokenListing[],
  ): Promise<TokenListing[]> {
    const fromAxelar = knownTokens.filter(
      (token) => token.identifiers?.axelarId,
    )

    const results: TokenListing[] = []
    for (const token of fromAxelar) {
      if (token.deployment?.contractName === 'BurnableMintableCappedERC20') {
        results.push({ ...token, bridge: { name: 'Axelar' } })
      }
    }

    return Promise.resolve(results)
  }
}
