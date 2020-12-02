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
import axios from 'axios';
import { BigNumber as EthersBigNumber } from 'ethers';
import * as assetsServices from 'services/assets';
import * as theGraphServices from 'services/theGraph';
import * as rariServices from 'services/rari';
import * as rariPoolsAPYServices from 'services/rariPoolsAPY';


const dxdyResponseMock = {
  data: {
    markets: [
      {
        symbol: 'ETH',
        totalSupplyAPR: '0.00154213238476836850272433137299672772191883221247935363964792328700376265776',
      },
      {
        symbol: 'SAI',
        totalSupplyAPR: '0',
      },
      {
        symbol: 'USDC',
        totalSupplyAPR: '0.02330739900501809899612979009708292303235983353840018640099782453618166140064',
      },
      {
        symbol: 'DAI',
        totalSupplyAPR: '0.05977008737193982329225768604233705051547630369478300102441022735745242159024',
      },
    ],
  },
};

const compoundResponseMock = {
  data: {
    cToken: [
      {
        comp_supply_apy: { value: '0.9694499078447771' },
        supply_rate: { value: '0.015673065844652102048604242' },
        underlying_symbol: 'ZRX',
      },
      {
        comp_supply_apy: { value: '2.627855685291336' },
        supply_rate: { value: '0.029186741035532396480234908' },
        underlying_symbol: 'DAI',
      },
      {
        comp_supply_apy: { value: '2.6357081044964703' },
        supply_rate: { value: '0.029736702133039390150730041' },
        underlying_symbol: 'USDT',
      },
    ],
  },
};

const aaveResponseMock = {
  reserves: [
    { liquidityRate: '39111941312306153721143568', symbol: 'SUSD' },
    { liquidityRate: '42484460415943642446481260', symbol: 'DAI' },
    { liquidityRate: '55810751776380537725041490', symbol: 'USDT' },
  ],
};

const mstableResponseMock = {
  day0: [{ rate: '1.122246649538691619', timestamp: 1603798181 }],
  day1: [{ rate: '1.122399899360735757', timestamp: 1603879625 }],
};

const rawFundBalancesAndPricesMock = [
  ['DAI', 'USDC', 'USDT', 'sUSD', 'mUSD'],
  [
    EthersBigNumber.from('0'),
    EthersBigNumber.from('713219202670'),
    EthersBigNumber.from('107296745737'),
    EthersBigNumber.from('0'),
    EthersBigNumber.from('94238471423269150617418'),
  ],
  [[0, 1, 2], [0, 1, 2], [1], [2], [3]],
  [
    [EthersBigNumber.from('0'), EthersBigNumber.from('0'), EthersBigNumber.from('0')],
    [EthersBigNumber.from('0'), EthersBigNumber.from('19482827177258'), EthersBigNumber.from('4003712645519')],
    [EthersBigNumber.from('0'), EthersBigNumber.from('0')], [EthersBigNumber.from('7541136496199315660800')],
    [EthersBigNumber.from('10171870544969988274849431')],
  ],
  [
    EthersBigNumber.from('1008900000000000000'),
    EthersBigNumber.from('994939333039460000'),
    EthersBigNumber.from('995322887138550000'),
    EthersBigNumber.from('985235414332483000'),
    EthersBigNumber.from('995039816641156434'),
  ],
];

const rawFundBalancesMock = [
  EthersBigNumber.from('13346167424260468551740'),
  [0, 1, 2, 3],
  [
    EthersBigNumber.from('0'),
    EthersBigNumber.from('4747552986564061859255'),
    EthersBigNumber.from('0'),
    EthersBigNumber.from('91147987192706265863422'),
  ],
];

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

    const accountsBalance = await rariServices.getAccountDepositInUSD('0x0000');
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

    const accountsInterests = await rariServices.getUserInterests('0x0000');
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
        interests: 400,
        interestsPercentage: 84.1892574507493,
      },
    });

    getContractMock.mockRestore();
    callSubgraphMock.mockRestore();
  });

  it('calculates dxdy pool APY', async () => {
    const axiosGetMock = jest.spyOn(axios, 'get');
    axiosGetMock.mockImplementation(() => dxdyResponseMock);
    const dxdyPoolAPY = await rariPoolsAPYServices.getDydxApyBNs();
    expect(dxdyPoolAPY).toEqual({
      USDC: EthersBigNumber.from('23307399005018100'),
      DAI: EthersBigNumber.from('59770087371939824'),
      ETH: EthersBigNumber.from('1542132384768368'),
    });
    axiosGetMock.mockRestore();
  });

  it('calculates Compound pool APY', async () => {
    const axiosGetMock = jest.spyOn(axios, 'get');
    axiosGetMock.mockImplementation(() => compoundResponseMock);

    const compoundAPY = await rariPoolsAPYServices.getCompoundApyBNs();
    expect(compoundAPY).toEqual({
      DAI: EthersBigNumber.from('55465297888445756'),
      USDT: EthersBigNumber.from('56093783178004092'),
    });

    axiosGetMock.mockRestore();
  });

  it('calculates Aave pool APY', async () => {
    const callSubgraphMock = jest.spyOn(theGraphServices, 'callSubgraph');
    callSubgraphMock.mockImplementation(() => aaveResponseMock);

    const aaveAPY = await rariPoolsAPYServices.getAaveApyBNs();
    expect(aaveAPY).toEqual({
      sUSD: EthersBigNumber.from('39111941312306153'),
      DAI: EthersBigNumber.from('42484460415943642'),
      USDT: EthersBigNumber.from('55810751776380537'),
    });

    callSubgraphMock.mockRestore();
  });

  it('calculates MStable pool APY', async () => {
    const callSubgraphMock = jest.spyOn(theGraphServices, 'callSubgraph');
    callSubgraphMock.mockImplementation(() => mstableResponseMock);

    const mstableAPY = await rariPoolsAPYServices.getMStableApyBN();
    expect(mstableAPY).toEqual({
      mUSD: EthersBigNumber.from('51102525409616640'),
    });

    callSubgraphMock.mockRestore();
  });

  it('calculates current APY', async () => {
    const getContractMock = jest.spyOn(assetsServices, 'getContract');
    getContractMock.mockImplementation(() => ({
      callStatic: {
        getRawFundBalancesAndPrices: () => Promise.resolve(rawFundBalancesAndPricesMock),
        getRawFundBalances: () => Promise.resolve(rawFundBalancesMock),
      },
    }));
    const dxdyMock = jest.spyOn(rariPoolsAPYServices, 'getDydxApyBNs');
    dxdyMock.mockImplementation(() => ({
      USDC: EthersBigNumber.from('20371538472554336'),
      DAI: EthersBigNumber.from('57526787682671872'),
      ETH: EthersBigNumber.from('57526787682671872'),
    }));
    const compoundMock = jest.spyOn(rariPoolsAPYServices, 'getCompoundApyBNs');
    compoundMock.mockImplementation(() => ({
      USDT: EthersBigNumber.from('118139984932180496'),
      USDC: EthersBigNumber.from('57545168116122852'),
      DAI: EthersBigNumber.from('57124181513273156'),
      ETH: EthersBigNumber.from('57526787682671872'),
    }));
    const aaveMock = jest.spyOn(rariPoolsAPYServices, 'getAaveApyBNs');
    aaveMock.mockImplementation(() => ({
      sUSD: EthersBigNumber.from('82578073887035934'),
      DAI: EthersBigNumber.from('58221906578824085'),
      USDC: EthersBigNumber.from('114180230046107991'),
      ETH: EthersBigNumber.from('57526787682671872'),
    }));
    const mStableMock = jest.spyOn(rariPoolsAPYServices, 'getMStableApyBN');
    mStableMock.mockImplementation(() => ({
      mUSD: EthersBigNumber.from('55170557757646464'),
    }));


    const apy = await rariServices.getRariAPY();
    expect(apy).toEqual({ ETH_POOL: 5.049868315523945, STABLE_POOL: 6.18867160941854, YIELD_POOL: 6.18867160941854 });

    getContractMock.mockRestore();
    dxdyMock.mockRestore();
    compoundMock.mockRestore();
    aaveMock.mockRestore();
    mStableMock.mockRestore();
  });
});
