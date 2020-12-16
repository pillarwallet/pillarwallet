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
import { BigNumber as EthersBigNumber, utils } from 'ethers';
import { getRariDepositTransactionsAndExchangeFee, getRariWithdrawTransaction, getMaxWithdrawAmount } from 'utils/rari';
import { scaleBN } from 'utils/common';
import * as assetsServices from 'services/assets';
import * as _0xService from 'services/0x';
import * as rariService from 'services/rari';
import { getRariPoolsEnv } from 'configs/envConfig';
import { RARI_POOLS } from 'constants/rariConstants';

const ETH_USD = 5;

const rates = {
  ETH: { USD: ETH_USD },
};

const supportedAssetsMock = [
  {
    isPreferred: false,
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    description: 'Ethereum is a decentralized platform that runs smart contracts: applications that run exactly' +
      'asprogrammed without any possibility of downtime, censorship, fraud or third-party interference.',
    name: 'Ethereum',
    symbol: 'ETH',
    value: 'ETH',
    wallpaperUrl: 'asset/images/tokens/wallpaper/ethBg.png',
    iconUrl: 'asset/images/tokens/icons/ethColor.png',
    iconMonoUrl: 'asset/images/tokens/icons/eth.png',
    email: '',
    telegram: '',
    twitter: 'https://twitter.com/ethereum',
    website: 'https://ethereum.org/',
    whitepaper: '',
    isDefault: true,
    patternUrl: 'asset/images/patternIcons/eth.png',
    updatedAt: '2019-08-30T10:20:13.866Z',
    socialMedia: [],
    icos: [],
    id: '5c65a07d000204d2f9481c1c',
  },
  {
    isPreferred: false,
    address: '0x0C16e81FB5E5215DB5dd5e8ECa7Bb9975fFa0F75',
    decimals: 18,
    description: '',
    name: 'DAI',
    symbol: 'DAI',
    value: 'DAI',
    wallpaperUrl: 'asset/images/tokens/wallpaper/plrBg.png',
    iconUrl: 'asset/images/tokens/icons/plrColor.png',
    iconMonoUrl: 'asset/images/tokens/icons/plr.png',
    email: 'info@pillarproject.io',
    telegram: 'https://t.me/pillarofficial',
    twitter: 'https://twitter.com/PillarWallet',
    website: 'https://pillarproject.io/',
    whitepaper: 'https://pillarproject.io/documents/Pillar-Gray-Paper.pdf',
    isDefault: true,
    patternUrl: 'asset/images/patternIcons/plr.png',
    updatedAt: '2019-07-19T12:43:23.540Z',
    id: '5c65a07d000204d2f9481c1d',
    totalSupply: '',
    socialMedia: [],
    icos: [],
  },
  {
    isPreferred: false,
    address: '0x0C16e81FB5E5215DB5dd5e8ECa7Bb9975fFa0F75',
    decimals: 6,
    description: '',
    name: 'USD Coin',
    symbol: 'USDC',
    value: 'USDC',
    wallpaperUrl: 'asset/images/tokens/wallpaper/plrBg.png',
    iconUrl: 'asset/images/tokens/icons/plrColor.png',
    iconMonoUrl: 'asset/images/tokens/icons/plr.png',
    email: 'info@pillarproject.io',
    telegram: 'https://t.me/pillarofficial',
    twitter: 'https://twitter.com/PillarWallet',
    website: 'https://pillarproject.io/',
    whitepaper: 'https://pillarproject.io/documents/Pillar-Gray-Paper.pdf',
    isDefault: true,
    patternUrl: 'asset/images/patternIcons/plr.png',
    updatedAt: '2019-07-19T12:43:23.540Z',
    id: '5c65a07d000204d2f9481c1d',
    totalSupply: '',
    socialMedia: [],
    icos: [],
  },
];

const balancesAndPricesMock = [
  ['DAI', 'USDC'],
  ['0', '90852220468'],
  [
    ['0', '1', '2'],
    ['0', '1', '2'],
  ],
  [
    ['0', '0', '0'],
    ['0', '0', '0'],
  ],
  [
    '1000000000000000000',
    '1000000000000000000',
  ]];

const senderAddress = '0x0000';

describe('Rari utils', () => {
  describe('getRariDepositTransactionsAndExchangeFee', () => {
    beforeAll(() => {
      jest.spyOn(assetsServices, 'getContract').mockImplementation(() => ({
        callStatic: {
          getAcceptedCurrencies: () => Promise.resolve(['USDC']),
        },
        allowance: () => Promise.resolve(0),
        getSwapOutput: () => {
          const result = {};
          result['0'] = true;
          result.output = '499700';
          return Promise.resolve(result);
        },
      }));

      jest.spyOn(assetsServices, 'encodeContractMethod').mockImplementation((contract, method) => method);

      jest.spyOn(assetsServices, 'buildERC20ApproveTransactionData').mockImplementation(() => 'approvalTxData');

      jest.spyOn(_0xService, 'get0xSwapOrders').mockImplementation(() => [
        [
          {
            makerAssetAmount: '44926',
            takerAssetAmount: '100000000000000',
            signature: '0x04',
          },
        ],
        EthersBigNumber.from('100000000000000'),
        '123456',
        EthersBigNumber.from('100000000000000'),
        '460',
        '400',
      ]);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should return data for directly depositable currency', async () => {
      const data = await getRariDepositTransactionsAndExchangeFee(
        RARI_POOLS.STABLE_POOL, senderAddress, 1.23, supportedAssetsMock[2], supportedAssetsMock, rates,
      );

      expect(data).toEqual({
        depositTransactions: [
          {
            amount: 0,
            data: 'approvalTxData',
            from: '0x0000',
            symbol: 'ETH',
            to: supportedAssetsMock[2].address,
            extra: {
              amount: EthersBigNumber.from('1230000'),
              decimals: 6,
              rariPool: 'STABLE_POOL',
              symbol: 'USDC',
            },
            tag: 'RARI_DEPOSIT',
          },
          {
            amount: 0,
            data: 'deposit',
            from: '0x0000',
            symbol: 'ETH',
            to: getRariPoolsEnv(RARI_POOLS.STABLE_POOL).RARI_FUND_MANAGER_CONTRACT_ADDRESS,
          },
        ],
        exchangeFeeBN: EthersBigNumber.from(0),
        slippage: 0,
      });
    });

    it('should return data for stablecoin (mStable swap)', async () => {
      const data = await getRariDepositTransactionsAndExchangeFee(
        RARI_POOLS.STABLE_POOL, senderAddress, 1.23, supportedAssetsMock[1], supportedAssetsMock, rates,
      );

      expect(data).toEqual({
        depositTransactions: [
          {
            amount: 0,
            data: 'approvalTxData',
            from: '0x0000',
            symbol: 'ETH',
            to: supportedAssetsMock[1].address,
            extra: {
              amount: EthersBigNumber.from('1230000000000000000'),
              symbol: 'DAI',
              decimals: 18,
              rariPool: 'STABLE_POOL',
            },
            tag: 'RARI_DEPOSIT',
          },
          {
            amount: 0,
            data: 'exchangeAndDeposit(string,uint256,string)',
            from: '0x0000',
            symbol: 'ETH',
            to: getRariPoolsEnv(RARI_POOLS.STABLE_POOL).RARI_FUND_PROXY_CONTRACT_ADDRESS,
          },
        ],
        exchangeFeeBN: '0.146059999999999995',
        slippage: 0,
      });
    });

    it('should return correct data on other token (0x exchange)', async () => {
      const data = await getRariDepositTransactionsAndExchangeFee(
        RARI_POOLS.STABLE_POOL, senderAddress, 0.0001, supportedAssetsMock[0], supportedAssetsMock, rates,
      );

      expect(data).toEqual({
        depositTransactions: [
          {
            amount: 0.0001,
            data: 'exchangeAndDeposit(address,uint256,string,(address,address,address,' +
              'address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],uint256)',
            from: '0x0000',
            symbol: 'ETH',
            to: getRariPoolsEnv(RARI_POOLS.STABLE_POOL).RARI_FUND_PROXY_CONTRACT_ADDRESS,
            extra: {
              amount: EthersBigNumber.from('100000000000000'),
              symbol: 'ETH',
              decimals: 18,
              rariPool: 'STABLE_POOL',
            },
            tag: 'RARI_DEPOSIT',
          },
        ],
        exchangeFeeBN: EthersBigNumber.from('123456'),
        slippage: 13.043478260869565,
      });
    });
  });

  describe('getRariWithdrawTransaction', () => {
    beforeAll(() => {
      jest.spyOn(assetsServices, 'getContract').mockImplementation(() => ({
        callStatic: {
          getRawFundBalancesAndPrices: () => Promise.resolve(balancesAndPricesMock),
        },
        getSwapOutput: (inputToken, outputToken, amount) => {
          const result = {};
          result['0'] = true;
          result['2'] = amount.mul(scaleBN(12)).mul(scaleBN(18).sub('600000000000000')).div(scaleBN(18));
          return Promise.resolve(result);
        },
        swapFee: () => Promise.resolve('600000000000000'),
      }));

      jest.spyOn(assetsServices, 'encodeContractMethod')
        .mockImplementation((contract, method, params) => ({ method, params }));

      jest.spyOn(_0xService, 'get0xSwapOrders').mockImplementation(() => Promise.resolve(
        [
          [
            {
              makerAssetAmount: '1230000000000000000',
              takerAssetAmount: '1235000',
              signature: '0x04',
            },
          ],
          EthersBigNumber.from('1235000'),
          '123456',
          EthersBigNumber.from('1235000'),
          '460',
          '400',
          EthersBigNumber.from('1230000000000000000'),
        ]),
      );
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should return data for directly withdrawable currency', async () => {
      const data = await getRariWithdrawTransaction(
        RARI_POOLS.STABLE_POOL, senderAddress, 1.23, supportedAssetsMock[2],
      );

      expect(data).toEqual({
        exchangeFeeBN: EthersBigNumber.from(0),
        slippage: 0,
        withdrawTransaction: {
          amount: 0,
          data: {
            method: 'withdraw',
            params: [
              'USDC',
              EthersBigNumber.from('1230000'),
            ],
          },
          from: senderAddress,
          symbol: 'ETH',
          to: getRariPoolsEnv(RARI_POOLS.STABLE_POOL).RARI_FUND_MANAGER_CONTRACT_ADDRESS,
          extra: {
            amount: EthersBigNumber.from('1230000'),
            decimals: 6,
            rariPool: 'STABLE_POOL',
            symbol: 'USDC',
          },
          tag: 'RARI_WITHDRAW',
        },
      });
    });
    it('should exchange via for mStable', async () => {
      const data = await getRariWithdrawTransaction(
        RARI_POOLS.STABLE_POOL, senderAddress, 1.23, supportedAssetsMock[1],
      );

      expect(data).toEqual({
        exchangeFeeBN: EthersBigNumber.from(0),
        slippage: 0,
        withdrawTransaction: {
          amount: 0,
          data: {
            method: 'withdrawAndExchange',
            params: [
              ['USDC'],
              [EthersBigNumber.from('1230739')],
              supportedAssetsMock[1].address,
              [[]],
              [[]],
              [EthersBigNumber.from(0)],
              [EthersBigNumber.from(0)],
            ],
          },
          from: senderAddress,
          symbol: 'ETH',
          to: getRariPoolsEnv(RARI_POOLS.STABLE_POOL).RARI_FUND_PROXY_CONTRACT_ADDRESS,
          extra: {
            amount: EthersBigNumber.from('1230000000000000000'),
            symbol: 'DAI',
            decimals: 18,
            rariPool: 'STABLE_POOL',
          },
          tag: 'RARI_WITHDRAW',
        },
      });
    });
    it('should exchange via 0x', async () => {
      const data = await getRariWithdrawTransaction(
        RARI_POOLS.STABLE_POOL, senderAddress, 1.23, supportedAssetsMock[0],
      );

      expect(data).toEqual({
        exchangeFeeBN: EthersBigNumber.from('123456'),
        slippage: 13.043478260869565,
        withdrawTransaction: {
          amount: parseFloat(utils.formatEther('123456')),
          data: {
            method: 'withdrawAndExchange',
            params: [
              ['USDC'],
              [EthersBigNumber.from('1235000')],
              supportedAssetsMock[0].address,
              [[{
                makerAssetAmount: '1230000000000000000',
                takerAssetAmount: '1235000',
              }]],
              [['0x04']],
              [EthersBigNumber.from('1230000000000000000')],
              [EthersBigNumber.from('123456')],
            ],
          },
          from: senderAddress,
          symbol: 'ETH',
          to: getRariPoolsEnv(RARI_POOLS.STABLE_POOL).RARI_FUND_PROXY_CONTRACT_ADDRESS,
          extra: {
            amount: EthersBigNumber.from('1230000000000000000'),
            symbol: 'ETH',
            decimals: 18,
            rariPool: 'STABLE_POOL',
          },
          tag: 'RARI_WITHDRAW',
        },
      });
    });
  });

  describe('getMaxWithdrawAmount', () => {
    beforeAll(() => {
      jest.spyOn(assetsServices, 'getContract').mockImplementation(() => ({
        callStatic: {
          getRawFundBalancesAndPrices: () => Promise.resolve(balancesAndPricesMock),
        },
        getSwapOutput: (inputToken, outputToken, amount) => {
          const result = {};
          result['0'] = true;
          result['2'] = amount.mul(scaleBN(12)).mul(scaleBN(18).sub('600000000000000')).div(scaleBN(18));
          return Promise.resolve(result);
        },
        swapFee: () => Promise.resolve('600000000000000'),
      }));

      jest.spyOn(assetsServices, 'encodeContractMethod')
        .mockImplementation((contract, method, params) => ({ method, params }));

      jest.spyOn(rariService, 'getAccountDepositInUSDBN')
        .mockImplementation(() => EthersBigNumber.from('10000000000000000000'));

      jest.spyOn(_0xService, 'get0xSwapOrders').mockImplementation(() => Promise.resolve(
        [
          [
            {
              makerAssetAmount: '1230000000000000000',
              takerAssetAmount: '10000000',
              signature: '0x04',
            },
          ],
          EthersBigNumber.from('10000000'),
          '123456',
          EthersBigNumber.from('10000000'),
          '460',
          '400',
          EthersBigNumber.from('1230000000000000000'),
        ]),
      );
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should return max withdraw for directly withdrawable currency', async () => {
      const maxWithdraw = await getMaxWithdrawAmount(RARI_POOLS.STABLE_POOL, supportedAssetsMock[2], senderAddress);

      expect(maxWithdraw).toEqual(EthersBigNumber.from('10000000'));
    });
    it('should exchange via for mStable', async () => {
      const maxWithdraw = await getMaxWithdrawAmount(RARI_POOLS.STABLE_POOL, supportedAssetsMock[1], senderAddress);
      expect(maxWithdraw).toEqual(EthersBigNumber.from('9994000000000000000'));
    });
    it('should exchange via 0x', async () => {
      const maxWithdraw = await getMaxWithdrawAmount(RARI_POOLS.STABLE_POOL, supportedAssetsMock[0], senderAddress);
      expect(maxWithdraw).toEqual(EthersBigNumber.from('1230000000000000000'));
    });
  });
});
