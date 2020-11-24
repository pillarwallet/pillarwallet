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
import { getRariDepositTransactionsAndExchangeFee } from 'utils/rari';
import * as assetsServices from 'services/assets';
import * as _0xService from 'services/0x';
import { getEnv } from 'configs/envConfig';
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

describe('Rari utils', () => {
  describe('getRariDepositTransactionsAndExchangeFee', () => {
    const senderAddress = '0x0000';

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
          },
          {
            amount: 0,
            data: 'deposit',
            from: '0x0000',
            symbol: 'ETH',
            to: getEnv().RARI_FUND_MANAGER_CONTRACT_ADDRESS,
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
          },
          {
            amount: 0,
            data: 'exchangeAndDeposit(string,uint256,string)',
            from: '0x0000',
            symbol: 'ETH',
            to: getEnv().RARI_FUND_PROXY_CONTRACT_ADDRESS,
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
            amount: 0.000100000000123456,
            data: 'exchangeAndDeposit(address,uint256,string,(address,address,address,' +
              'address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],uint256)',
            from: '0x0000',
            symbol: 'ETH',
            to: getEnv().RARI_FUND_PROXY_CONTRACT_ADDRESS,
          },
        ],
        exchangeFeeBN: EthersBigNumber.from('123456'),
        slippage: 13.043478260869565,
      });
    });
  });
});
