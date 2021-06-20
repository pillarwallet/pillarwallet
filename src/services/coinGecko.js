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

// Constants
import {
  BNB,
  ETH,
  MATIC,
  rateKeys,
  XDAI,
} from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';

// Utils
import { getAssetsAsList } from 'utils/assets';
import { isCaseInsensitiveMatch, reportErrorLog } from 'utils/common';
import httpRequest from 'utils/httpRequest';
import { type Record, mapRecordKeys } from 'utils/object';
import { nativeAssetPerChain } from 'utils/chains';

// Types
import type { Asset, AssetsBySymbol } from 'models/Asset';
import type {
  RateByCurrencySymbol,
  RateKey,
  RatesByAssetSymbol,
} from 'models/Rates';
import type { Chain } from 'models/Chain';

// { "usd": 382.72, "eur": 314.22, "gbp": 270.63, "eth": 0.14214279 }
type CoinGeckoPriceEntry = Record<number>;

type CoinGeckoAssetsPrices = {
  [coinGeckoAssetId: string]: CoinGeckoPriceEntry,
};

// does not change between envs
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

const requestConfig = {
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

const currenciesParam = rateKeys.map(key => key.toLocaleString()).join(',');

/* eslint-disable i18next/no-literal-string */
export const nativeAssetSymbolToCoinGeckoCoinId = {
  [ETH]: 'ethereum',
  [MATIC]: 'matic-network',
  [BNB]: 'binancecoin',
  [XDAI]: 'xdai',
};

const chainToCoinGeckoNetwork = {
  [CHAIN.ETHEREUM]: 'ethereum',
  [CHAIN.POLYGON]: 'polygon-pos',
  [CHAIN.BINANCE]: 'binance-smart-chain',
  [CHAIN.XDAI]: 'xdai',
};
/* eslint-enable i18next/no-literal-string */

const mapWalletAndCoinGeckoAssetsPrices = (
  responseData: CoinGeckoAssetsPrices,
  assetsList: Asset[],
): RatesByAssetSymbol => Object.keys(responseData).reduce((mappedResponseData, contractAddress) => {
  const walletAsset = assetsList.find(({ address }) => isCaseInsensitiveMatch(address, contractAddress));
  if (walletAsset) {
    const { symbol } = walletAsset;
    mappedResponseData[symbol] = mapPricesToRates(responseData[contractAddress]);
  }
  return mappedResponseData;
}, {});

export const getCoinGeckoTokenPrices = async (
  chain: Chain,
  assets: AssetsBySymbol,
): Promise<?RatesByAssetSymbol> => {
  const assetsList = getAssetsAsList(assets);
  const nativeAssetSymbol = nativeAssetPerChain[chain].symbol;

  // native asset not always fit into token price endpoint, it is fetched with other API call
  const assetsListWithoutNativeAsset = assetsList.filter(({ symbol }) => symbol !== nativeAssetSymbol);

  const assetsContractAddresses = assetsListWithoutNativeAsset.map(({ address }) => address);

  const contractAddressesQuery = assetsContractAddresses.join(',');

  const coinGeckoNetwork = chainToCoinGeckoNetwork[chain];

  return httpRequest
    .get(
      `${COINGECKO_API_URL}/simple/token_price/${coinGeckoNetwork}` +
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

      return mapWalletAndCoinGeckoAssetsPrices(responseData, assetsListWithoutNativeAsset);
    })
    .catch((error) => {
      reportErrorLog('getCoinGeckoTokenPrices failed: API request error', {
        error,
        assetsContractAddresses,
      });
      return null;
    });
};

export const getCoinGeckoPricesByCoinId = async (coinId: string): Promise<?RateByCurrencySymbol> => {
  const params = {
    ids: coinId,
    vs_currencies: currenciesParam,
  };

  try {
    const response = await httpRequest.get(
      `${COINGECKO_API_URL}/simple/price?${querystring.stringify(params)}`,
      requestConfig,
    );
    if (!response.data) {
      reportErrorLog('getCoinGeckoPricesByCoinId failed: unexpected response', { coinId, response: response.data });
      return null;
    }

    return mapPricesToRates(response.data[coinId]);
  } catch (error) {
    reportErrorLog('getCoinGeckoPricesByCoinId failed: API request error', { coinId, error });
    return null;
  }
};

const mapPricesToRates = (prices: ?CoinGeckoPriceEntry): ?RateByCurrencySymbol => {
  if (isEmpty(prices)) return null;
  return mapRecordKeys(prices, findRateKeyFromCoinGeckoCurrency);
};

const findRateKeyFromCoinGeckoCurrency = (coinGeckoCurrency: string): ?RateKey => {
  return rateKeys.find((key) => isCaseInsensitiveMatch(coinGeckoCurrency, key));
};
