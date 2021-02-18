// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import { BigNumber as EthersBigNumber } from 'ethers';
import * as assetsServices from 'services/assets';
import * as theGraphServices from 'services/theGraph';
import * as rariServices from 'services/rari';

const ETH_USD = 5;

const rates = {
  ETH: { USD: ETH_USD },
};

describe('Rari service', () => {
  it('fetches fund balance in USD', async () => {
    const getContractMock = jest.spyOn(assetsServices, 'getContract');
    getContractMock.mockImplementation(() => ({
      callStatic: {
        getFundBalance: () => Promise.resolve(EthersBigNumber.from('123450000000000000000')),
      },
    }));

    const fundBalance = await rariServices.getRariFundBalanceInUSD(rates);
    expect(fundBalance).toEqual({ ETH_POOL: 617.25, STABLE_POOL: 123.45, YIELD_POOL: 123.45 });

    getContractMock.mockRestore();
  });

  it('fetches account deposit in USD', async () => {
    const getContractMock = jest.spyOn(assetsServices, 'getContract');
    getContractMock.mockImplementation(() => ({
      callStatic: {
        balanceOf: (address) => address === '0x0000' && Promise.resolve(EthersBigNumber.from('123450000000000000000')),
      },
    }));

    const accountsBalance = await rariServices.getAccountDeposit('0x0000');
    expect(accountsBalance).toEqual({ ETH_POOL: 123.45, STABLE_POOL: 123.45, YIELD_POOL: 123.45 });

    getContractMock.mockRestore();
  });

  it('fetches account balance in pool token', async () => {
    const getContractMock = jest.spyOn(assetsServices, 'getContract');
    getContractMock.mockImplementation(() => ({
      balanceOf: (address) => address === '0x0000' && Promise.resolve(EthersBigNumber.from('123450000000000000000')),
    }));

    const accountsBalance = await rariServices.getAccountDepositInPoolToken('0x0000');
    expect(accountsBalance).toEqual({ ETH_POOL: 123.45, STABLE_POOL: 123.45, YIELD_POOL: 123.45 });

    getContractMock.mockRestore();
  });

  it('fetches account interests', async () => {
    const getContractMock = jest.spyOn(assetsServices, 'getContract');
    getContractMock.mockImplementation(() => ({
      callStatic: {
        balanceOf: (address) => Promise.resolve(address === '0x0000' && EthersBigNumber.from('875120000000000000000')),
      },
      balanceOf: (address) => Promise.resolve(address === '0x0000' && EthersBigNumber.from('475120000000000000000')),
    }));

    const callSubgraphMock = jest.spyOn(theGraphServices, 'callSubgraph');
    callSubgraphMock.mockImplementation(() => ({
      transfersOut: [
        { amount: '123000000000000000000', amountInUSD: '123000000000000000000', timestamp: '123' },
      ],
      transfersIn: [
        { amount: '120000000000000000000', amountInUSD: '120000000000000000000', timestamp: '100' },
        { amount: '450000000000000000000', amountInUSD: '450000000000000000000', timestamp: '300' },
      ],
    }));

    const accountsInterests = await rariServices.getUserInterests('0x0000', rates);
    expect(accountsInterests).toEqual({
      STABLE_POOL: {
        interests: 400,
        interestsPercentage: 84.1892574507493,
      },
      YIELD_POOL: {
        interests: 400,
        interestsPercentage: 84.1892574507493,
      },
      ETH_POOL: {
        interests: 2000,
        interestsPercentage: 84.1892574507493,
      },
    });

    getContractMock.mockRestore();
    callSubgraphMock.mockRestore();
  });
});
