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

import querystring from 'querystring';

// utils
import { getAssetsAsList } from 'utils/assets';
import { isCaseInsensitiveMatch, reportErrorLog } from 'utils/common';
import httpRequest from 'utils/httpRequest';
import { type Record } from 'utils/object';

// constants
import { ETH, supportedFiatCurrencies, BTC, WBTC } from 'constants/assetsConstants';

// types
import type { Asset, Assets } from 'models/Asset';

// { USD: 100.0, EUR: 100.0, GBP: 100.0, ETH: 0.0 }
type PriceRecord = Record<number>;

type CoinGeckoAssetsPrices = {
  [coinGeckoAssetId: string]: {
    [currency: string]: number,
  },
};

// does not change between envs
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

const BTC_ID = 'bitcoin';
const WBTC_ID = 'wrapped-bitcoin';

export const CoinId = {
  ETH: 'ethereum',
  BNB: 'binancecoin',
};

const requestConfig = {
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

const mapWalletAndCoinGeckoCurrencies = (
  coinGeckoSingleAssetPrices: ?PriceRecord,
  walletCurrencies: string[],
): ?Record<number> => {
  if (!coinGeckoSingleAssetPrices) return null;

  return Object.keys(coinGeckoSingleAssetPrices).reduce((mappedCurrencies, coinGeckoCurrency) => {
    const currency = walletCurrencies.find((walletCurrency) =>
      isCaseInsensitiveMatch(coinGeckoCurrency, walletCurrency),
    );
    if (currency) {
      mappedCurrencies[currency] = coinGeckoSingleAssetPrices[coinGeckoCurrency];
    }

    return mappedCurrencies;
  }, {});
};

const mapWalletAndCoinGeckoAssetsPrices = (
  responseData: CoinGeckoAssetsPrices,
  assetsList: Asset[],
  walletCurrencies: string[],
) => Object.keys(responseData).reduce((mappedResponseData, contractAddress) => {
  const walletAsset = assetsList.find(({ address }) => isCaseInsensitiveMatch(address, contractAddress));
  if (walletAsset) {
    const { symbol } = walletAsset;
    // map currencies
    mappedResponseData[symbol] = mapWalletAndCoinGeckoCurrencies(
      responseData[contractAddress],
      walletCurrencies,
    );
  }
  return mappedResponseData;
}, {});

export const getCoinGeckoTokenPrices = async (assets: Assets): Promise<?Object> => {
  const assetsList = getAssetsAsList(assets);

  // ether does not fit into token price endpoint
  const assetsListWithoutEther = assetsList.filter(({ symbol }) => symbol !== ETH);

  const assetsContractAddresses = assetsListWithoutEther.map(({ address }) => address);

  const walletCurrencies = supportedFiatCurrencies.concat(ETH);

  const contractAddressesQuery = assetsContractAddresses.join(',');
  const vsCurrenciesQuery = walletCurrencies.map((currency) => currency.toLowerCase()).join(',');

  return httpRequest.get(
    `${COINGECKO_API_URL}/simple/token_price/ethereum`
    + `?contract_addresses=${contractAddressesQuery}`
    + `&vs_currencies=${vsCurrenciesQuery}`,
    requestConfig,
  )
    .then(({ data: responseData }) => {
      if (!responseData) {
        reportErrorLog('getCoinGeckoTokenPrices failed: unexpected response', {
          response: responseData,
          assetsContractAddresses,
        });
        return null;
      }

      return mapWalletAndCoinGeckoAssetsPrices(responseData, assetsListWithoutEther, walletCurrencies);
    })
    .catch((error) => {
      reportErrorLog('getCoinGeckoTokenPrices failed: API request error', {
        error,
        assetsContractAddresses,
      });
      return null;
    });
};

export const getCoinGeckoPricesByCoinIds = async (coinIds: string[]): Promise<(?PriceRecord)[]> => {
  const currencies = supportedFiatCurrencies.concat(ETH);

  const params = {
    ids: coinIds.join(','),
    vs_currencies: currencies.map((currency) => currency.toLowerCase()).join(','),
  };

  try {
    const response = await httpRequest.get(
      `${COINGECKO_API_URL}/simple/price?${querystring.stringify(params)}`,
      requestConfig,
    );
    if (!response.data) {
      reportErrorLog('getCoinGeckoPricesByCoinIds failed: unexpected response', { coinIds, response: response.data });
      return [];
    }

    return coinIds.map((coinId) => mapWalletAndCoinGeckoCurrencies(response.data[coinId], currencies));
  } catch (error) {
    reportErrorLog('getCoinGeckoPricesByCoinIds failed: API request error', { coinIds, error });
    return [];
  }
};

export const getCoinGeckoBitcoinAndWBTCPrices = async (): Promise<?Object> => {
  const walletCurrencies = supportedFiatCurrencies.concat(ETH);
  const vsCurrenciesQuery = walletCurrencies.map((currency) => currency.toLowerCase()).join(',');
  return httpRequest.get(
    `${COINGECKO_API_URL}/simple/price?ids=${BTC_ID},${WBTC_ID}&vs_currencies=${vsCurrenciesQuery}`,
    requestConfig,
  )
    .then(({ data: responseData }) => {
      if (!responseData) {
        reportErrorLog('getCoinGeckoBitcoinAndWBTCPrices failed: unexpected response', { response: responseData });
        return null;
      }
      return {
        [BTC]: mapWalletAndCoinGeckoCurrencies(responseData[BTC_ID], walletCurrencies),
        [WBTC]: mapWalletAndCoinGeckoCurrencies(responseData[WBTC_ID], walletCurrencies),
      };
    })
    .catch((error) => {
      reportErrorLog('getCoinGeckoBitcoinAndWBTCPrices failed: API request error', { error });
      return null;
    });
};
