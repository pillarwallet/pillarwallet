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
import { rateKeys } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';

// Utils
import { reportErrorLog, logBreadcrumb, addressAsKey } from 'utils/common';
import httpRequest from 'utils/httpRequest';
import { nativeAssetPerChain } from 'utils/chains';
import { addressesEqual } from 'utils/assets';

// Types
import type { Asset } from 'models/Asset';
import type { Rates, RatesByAssetAddress } from 'models/Rates';
import type { Chain } from 'models/Chain';

type CoinGeckoAssetsPrices = {
  [coinGeckoAssetId: string]: CoinGeckoPriceEntry,
};

type CoinGeckoPriceEntry = {
  usd?: number,
  eur?: number,
  gbp?: number,
  eth?: number,
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

const currenciesParam = rateKeys.map((key) => key.toLocaleString()).join(',');

/* eslint-disable i18next/no-literal-string */
export const chainToCoinGeckoCoinId = {
  [CHAIN.ETHEREUM]: 'ethereum',
  [CHAIN.POLYGON]: 'matic-network',
  [CHAIN.BINANCE]: 'binancecoin',
  [CHAIN.XDAI]: 'xdai',
  [CHAIN.AVALANCHE]: 'avalanche-2',
};

const chainToCoinGeckoNetwork = {
  [CHAIN.ETHEREUM]: 'ethereum',
  [CHAIN.POLYGON]: 'polygon-pos',
  [CHAIN.BINANCE]: 'binance-smart-chain',
  [CHAIN.XDAI]: 'xdai',
  [CHAIN.AVALANCHE]: 'avalanche-2',
};
/* eslint-enable i18next/no-literal-string */

const mapWalletAndCoinGeckoAssetsPrices = (responseData: CoinGeckoAssetsPrices): RatesByAssetAddress =>
  Object.keys(responseData).reduce(
    (mappedResponseData, contractAddress) => ({
      ...mappedResponseData,
      [addressAsKey(contractAddress)]: mapPricesToRates(responseData[contractAddress]),
    }),
    {},
  );

export const getCoinGeckoTokenPrices = async (chain: Chain, assets: Asset[]): Promise<?RatesByAssetAddress> => {
  // native asset not always fit into token price endpoint, it is fetched with other API call
  const assetsWithoutNativeAsset = assets.filter(
    ({ address }) => !addressesEqual(address, nativeAssetPerChain[chain].address),
  );

  const assetsContractAddresses = assetsWithoutNativeAsset.map(({ address }) => address);

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
        logBreadcrumb('getCoinGeckoTokenPrices', 'failed: unexpected response', {
          response: responseData,
          assetsContractAddresses,
        });
        return null;
      }

      return mapWalletAndCoinGeckoAssetsPrices(responseData);
    })
    .catch((error) => {
      reportErrorLog('getCoinGeckoTokenPrices failed: API request error', {
        error,
        assetsContractAddresses,
      });
      return null;
    });
};

export const getCoinGeckoPricesByCoinId = async (coinId: string): Promise<?Rates> => {
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
      logBreadcrumb('getCoinGeckoPricesByCoinId', 'failed: unexpected response', { coinId, response: response.data });
      return null;
    }

    return mapPricesToRates(response.data[coinId]);
  } catch (error) {
    reportErrorLog('getCoinGeckoPricesByCoinId failed: API request error', { coinId, error });
    return null;
  }
};

const mapPricesToRates = (prices: ?CoinGeckoPriceEntry): ?Rates => {
  if (isEmpty(prices)) return null;
  return {
    USD: prices.usd,
    EUR: prices.eur,
    GBP: prices.gbp,
    ETH: prices.eth,
  };
};
