import { getAddress } from 'viem'

export interface Address extends String {
  _TokenAddressBrand: string
}

export function Address(value: string): Address {
  if (!/\w+:\w+/.test(value)) {
    throw new Error(`Value is not a TokenAddress: ${value}`)
  }
  const [chainPrefix, address] = value.split(':')

  if (!chainPrefix || !isValidChainPrefix(chainPrefix)) {
    throw new Error(`Invalid chain prefix: ${chainPrefix}`)
  }

  if (address !== 'native' && (!address || !isChecksumAddress(address))) {
    throw new Error(`Invalid address format: ${address}`)
  }

  return value as unknown as Address
}

Address.isAddress = function isAddress(value: unknown): value is Address {
  try {
    Address(value as string)
    return true
  } catch {
    return false
  }
}

Address.getPrefix = function getPrefix(tokenAddress: Address): ChainPrefix {
  return tokenAddress.split(':')[0] as ChainPrefix
}

const ALLOWED_CHAIN_PREFIXES = ['eth', 'arb', 'op'] as const
export type ChainPrefix = (typeof ALLOWED_CHAIN_PREFIXES)[number]

export function isValidChainPrefix(value: string): value is ChainPrefix {
  return (ALLOWED_CHAIN_PREFIXES as readonly string[]).includes(value)
}

function isChecksumAddress(address: string): boolean {
  try {
    return getAddress(address) === address
  } catch {
    return false
  }
}
