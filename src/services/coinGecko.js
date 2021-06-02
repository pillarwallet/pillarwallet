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
import { isEmpty } from 'lodash';

// utils
import { getAssetsAsList } from 'utils/assets';
import { isCaseInsensitiveMatch, reportErrorLog } from 'utils/common';
import httpRequest from 'utils/httpRequest';
import { type Record, mapRecordKeys } from 'utils/object';

// constants
import { ETH, rateKeys, BTC, WBTC } from 'constants/assetsConstants';

// types
import type { Asset, Assets, Rates, RateEntry, RateKey } from 'models/Asset';

// { "usd": 382.72, "eur": 314.22, "gbp": 270.63, "eth": 0.14214279 }
type CoinGeckoPriceEntry = Record<number>;

type CoinGeckoAssetsPrices = {
  [coinGeckoAssetId: string]: CoinGeckoPriceEntry,
};

// does not change between envs
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

const BTC_ID = 'bitcoin';
const WBTC_ID = 'wrapped-bitcoin';

const requestConfig = {
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

const currenciesParam = rateKeys.map(key => key.toLocaleString()).join(',');

const mapWalletAndCoinGeckoAssetsPrices = (
  responseData: CoinGeckoAssetsPrices,
  assetsList: Asset[],
): Rates => Object.keys(responseData).reduce((mappedResponseData, contractAddress) => {
  const walletAsset = assetsList.find(({ address }) => isCaseInsensitiveMatch(address, contractAddress));
  if (walletAsset) {
    const { symbol } = walletAsset;
    mappedResponseData[symbol] = mapPricesToRates(responseData[contractAddress]);
  }
  return mappedResponseData;
}, {});

export const getCoinGeckoTokenPrices = async (assets: Assets): Promise<?Rates> => {
  const assetsList = getAssetsAsList(assets);

  // ether does not fit into token price endpoint
  const assetsListWithoutEther = assetsList.filter(({ symbol }) => symbol !== ETH);

  const assetsContractAddresses = assetsListWithoutEther.map(({ address }) => address);

  const contractAddressesQuery = assetsContractAddresses.join(',');

  return httpRequest
    .get(
      `${COINGECKO_API_URL}/simple/token_price/ethereum` +
        `?contract_addresses=${contractAddressesQuery}` +
        `&vs_currencies=${currenciesParam}`,
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

      return mapWalletAndCoinGeckoAssetsPrices(responseData, assetsListWithoutEther);
    })
    .catch((error) => {
      reportErrorLog('getCoinGeckoTokenPrices failed: API request error', {
        error,
        assetsContractAddresses,
      });
      return null;
    });
};

export const getCoinGeckoPricesByCoinIds = async (coinIds: string[]): Promise<(?RateEntry)[]> => {
  const params = {
    ids: coinIds.join(','),
    vs_currencies: currenciesParam,
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

    return coinIds.map((coinId) => mapPricesToRates(response.data[coinId]));
  } catch (error) {
    reportErrorLog('getCoinGeckoPricesByCoinIds failed: API request error', { coinIds, error });
    return [];
  }
};

export const getCoinGeckoBitcoinAndWBTCPrices = async (): Promise<?Object> => {
  return httpRequest.get(
    `${COINGECKO_API_URL}/simple/price?ids=${BTC_ID},${WBTC_ID}&vs_currencies=${currenciesParam}`,
    requestConfig,
  )
    .then(({ data: responseData }) => {
      if (!responseData) {
        reportErrorLog('getCoinGeckoBitcoinAndWBTCPrices failed: unexpected response', { response: responseData });
        return null;
      }
      return {
        [BTC]: mapPricesToRates(responseData[BTC_ID]),
        [WBTC]: mapPricesToRates(responseData[WBTC_ID]),
      };
    })
    .catch((error) => {
      reportErrorLog('getCoinGeckoBitcoinAndWBTCPrices failed: API request error', { error });
      return null;
    });
};

const mapPricesToRates = (prices: ?CoinGeckoPriceEntry): ?RateEntry => {
  if (isEmpty(prices)) return null;
  return mapRecordKeys(prices, findRateKeyFromCoinGeckoCurrency);
};

const findRateKeyFromCoinGeckoCurrency = (coinGeckoCurrency: string): ?RateKey => {
  return rateKeys.find((key) => isCaseInsensitiveMatch(coinGeckoCurrency, key));
};
