import { getAddress } from 'viem'

export interface Address extends String {
  _TokenAddressBrand: string
}

export function Address(value: string): Address {
  if (!/\w+:\w+/.test(value)) {
    throw new Error(`Value is not a TokenAddress: ${value}`)
  }
  const [chainPrefix, address] = value.split(':')

  if (!chainPrefix) {
    throw new Error(`Invalid chain prefix: ${chainPrefix}`)
  }

  if (!address || !isChecksumAddress(address)) {
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

Address.getPrefix = function getPrefix(tokenAddress: Address): string {
  return tokenAddress.split(':')[0] as string
}

Address.getRawAddress = function getRawAddress(
  tokenAddress: Address,
): `0x${string}` {
  return tokenAddress.split(':')[1] as `0x${string}`
}

function isChecksumAddress(address: string): boolean {
  try {
    return getAddress(address) === address
  } catch {
    return false
  }
}
