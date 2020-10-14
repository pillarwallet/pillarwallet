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
import axios, { AxiosResponse } from 'axios';
import { isCaseInsensitiveMatch, reportErrorLog } from 'utils/common';
import { ETH, supportedFiatCurrencies } from 'constants/assetsConstants';


type CoinGeckoAsset = {
  id: string,
  symbol: string,
  name: string,
};

type CoinGeckoAssetsPrices = {
  [coinGeckoAssetId: string]: {
    [currency: string]: number,
  },
};

// does not change between envs
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

const requestConfig = {
  timeout: 5000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

let cachedCoinGeckoAssets = null;

// note: there is no pagination for /coins/list endpoint
export const getCoinGeckoAssets = async (assetSymbols: string[]): Promise<?CoinGeckoAsset[]> => {
  if (!cachedCoinGeckoAssets) {
    // cache for current running instance as it's huge list that changes rarely
    cachedCoinGeckoAssets = await axios
      .get(`${COINGECKO_API_URL}/coins/list`, requestConfig)
      .then(({ data: responseData }: AxiosResponse) => responseData)
      .catch((error) => {
        reportErrorLog('getCoinGeckoAssets failed: API request error', { error, assetSymbols });
        return null;
      });
  }

  if (!cachedCoinGeckoAssets || !Array.isArray(cachedCoinGeckoAssets)) {
    reportErrorLog('getCoinGeckoAssets failed: unexpected data', { data: cachedCoinGeckoAssets, assetSymbols });
    return null;
  }

  return cachedCoinGeckoAssets.filter((coinGeckoAsset: CoinGeckoAsset) => assetSymbols.find(
    (assetSymbol) => isCaseInsensitiveMatch(assetSymbol, coinGeckoAsset.symbol)),
  );
};

const mapWalletAndCoinGeckoCurrencies = (
  coinGeckoSingleAssetPrices: { [string]: number },
  walletCurrencies: string[],
) => Object.keys(coinGeckoSingleAssetPrices).reduce((
  mappedCurrencies,
  coinGeckoCurrency,
) => {
  const currency = walletCurrencies.find((walletCurrency) => isCaseInsensitiveMatch(coinGeckoCurrency, walletCurrency));
  if (currency) {
    mappedCurrencies[currency] = coinGeckoSingleAssetPrices[coinGeckoCurrency];
  }

  return mappedCurrencies;
}, {});

const mapWalletAndCoinGeckoAssetsPrices = (
  responseData: CoinGeckoAssetsPrices,
  assetSymbols: string[],
  walletCurrencies: string[],
  coinGeckoAssets: CoinGeckoAsset[],
) => Object.keys(responseData).reduce((mappedResponseData, coinGeckoAssetId) => {
  const coinGeckoAsset = coinGeckoAssets.find(({ id }) => id === coinGeckoAssetId);

  // map asset symbol
  if (coinGeckoAsset) {
    const assetSymbol = assetSymbols.find((symbol) => isCaseInsensitiveMatch(coinGeckoAsset.symbol, symbol));
    if (assetSymbol) {
      // map currencies
      mappedResponseData[assetSymbol] = mapWalletAndCoinGeckoCurrencies(
        responseData[coinGeckoAssetId],
        walletCurrencies,
      );
    }
  }

  return mappedResponseData;
}, {});

export const getCoinGeckoTokenPrices = async (assetSymbols: string[]): Promise<?Object> => {
  const coinGeckoAssets = await getCoinGeckoAssets(assetSymbols);
  if (!coinGeckoAssets) {
    // report not needed
    return null;
  }

  const walletCurrencies = supportedFiatCurrencies.concat(ETH);

  const coinGeckoAssetIdsQuery = coinGeckoAssets.map(({ id }) => id).join(',');
  const vsCurrenciesQuery = walletCurrencies.map((currency) => currency.toLowerCase()).join(',');

  return axios.get(
    `${COINGECKO_API_URL}/simple/price?ids=${coinGeckoAssetIdsQuery}&vs_currencies=${vsCurrenciesQuery}`,
    requestConfig,
  )
    .then(({ data: responseData }: AxiosResponse) => {
      if (!responseData) {
        reportErrorLog('getCoinGeckoTokenPrices failed: unexpected response', { response: responseData, assetSymbols });
        return null;
      }

      return mapWalletAndCoinGeckoAssetsPrices(responseData, assetSymbols, walletCurrencies, coinGeckoAssets);
    })
    .catch((error) => {
      reportErrorLog('getCoinGeckoTokenPrices failed: API request error', { error, assetSymbols });
      return null;
    });
};
