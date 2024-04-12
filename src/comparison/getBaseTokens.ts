import { readFileSync } from 'fs'
import z from 'zod'

import { ComparableToken } from './toComparableTokens'

const BaseTokens = z.object({
  tokens: z.array(
    z.object({
      chainId: z.number(),
      address: z.string().optional(),
      coingeckoId: z.string(),
    }),
  ),
})

export function getBaseTokens(path: string): ComparableToken[] {
  const content = readFileSync(path, 'utf8')
  const object = JSON.parse(content) as unknown
  const result = BaseTokens.parse(object)

  return result.tokens.filter(
    (t): t is ComparableToken => t.address !== undefined,
  )
}
