import { expect } from 'earl'

import { Address } from './Address'

describe(Address.name, () => {
  it('supports tokens with address like DAI', () => {
    expect(() =>
      Address('eth:0x6B175474E89094C44Da98b954EedeAC495271d0F'),
    ).not.toThrow()
  })

  it('requires checksum', () => {
    expect(() =>
      Address('eth:0x6b175474e89094c44da98b954eedeac495271d0f'),
    ).toThrow('Invalid address format')
  })

  describe(Address.getPrefix.name, () => {
    it('returns the prefix', () => {
      const address = Address('op:0x4200000000000000000000000000000000000042')
      expect(Address.getPrefix(address)).toEqual('op')
    })
  })
})
