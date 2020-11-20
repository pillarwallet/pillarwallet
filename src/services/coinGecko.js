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

// utils
import { getAssetsAsList } from 'utils/assets';
import { isCaseInsensitiveMatch, reportErrorLog } from 'utils/common';

// constants
import { ETH, supportedFiatCurrencies, BTC, WBTC } from 'constants/assetsConstants';

// types
import type { Asset, Assets } from 'models/Asset';


type CoinGeckoAssetsPrices = {
  [coinGeckoAssetId: string]: {
    [currency: string]: number,
  },
};

// does not change between envs
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

const ETH_ID = 'ethereum';
const BTC_ID = 'bitcoin';
const WBTC_ID = 'wrapped-bitcoin';

const requestConfig = {
  timeout: 5000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
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

  return axios.get(
    `${COINGECKO_API_URL}/simple/token_price/ethereum`
    + `?contract_addresses=${contractAddressesQuery}`
    + `&vs_currencies=${vsCurrenciesQuery}`,
    requestConfig,
  )
    .then(({ data: responseData }: AxiosResponse) => {
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

export const getCoinGeckoEtherPrice = async (): Promise<?Object> => {
  const walletCurrencies = supportedFiatCurrencies.concat(ETH); // for consistency, price returned is 1:1
  const vsCurrenciesQuery = walletCurrencies.map((currency) => currency.toLowerCase()).join(',');
  return axios.get(
    `${COINGECKO_API_URL}/simple/price`
    + `?ids=${ETH_ID}`
    + `&vs_currencies=${vsCurrenciesQuery}`,
    requestConfig,
  )
    .then(({ data: responseData }: AxiosResponse) => {
      if (!responseData) {
        reportErrorLog('getCoinGeckoEtherPrice failed: unexpected response', { response: responseData });
        return null;
      }

      return mapWalletAndCoinGeckoCurrencies(responseData[ETH_ID], walletCurrencies);
    })
    .catch((error) => {
      reportErrorLog('getCoinGeckoEtherPrice failed: API request error', { error });
      return null;
    });
};

export const getCoinGeckoBitcoinAndWBTCPrices = async (): Promise<?Object> => {
  const walletCurrencies = supportedFiatCurrencies.concat(ETH);
  const vsCurrenciesQuery = walletCurrencies.map((currency) => currency.toLowerCase()).join(',');
  return axios.get(
    `${COINGECKO_API_URL}/simple/price?ids=${BTC_ID},${WBTC_ID}&vs_currencies=${vsCurrenciesQuery}`,
    requestConfig,
  )
    .then(({ data: responseData }: AxiosResponse) => {
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
