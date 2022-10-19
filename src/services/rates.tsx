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

import { isEmpty } from 'lodash';

// Utils
import { reportErrorLog, addressAsKey } from 'utils/common';
import { nativeAssetPerChain } from 'utils/chains';
import { addressesEqual } from 'utils/assets';
// Types
import type { Asset } from 'models/Asset';
import type { Rates, RatesByAssetAddress } from 'models/Rates';
import type { Chain } from 'models/Chain';

//  Local
import etherspotService from './etherspot';

type ExchangeAssetsPrices = {
  [coinGeckoAssetId: string]: ExchangeAssetsPrices;
};

type ExchangePriceEntry = {
  address?: string;
  usd?: number;
  eur?: number;
  gbp?: number;
  eth?: number;
};

const mapWalletAndExchangePrices = (responseData: ExchangeAssetsPrices): RatesByAssetAddress =>
  Object.keys(responseData).reduce(
    (mappedResponseData, contractAddress) => ({
      ...mappedResponseData,
      [addressAsKey(responseData[contractAddress].address)]: mapPricesToRates(responseData[contractAddress]),
    }),
    {},
  );

export const getExchangeTokenPrices = async (chain: Chain, assets: Asset[]): Promise<RatesByAssetAddress | any> => {
  // native asset not always fit into token price endpoint, it is fetched with other API call
  const assetsWithoutNativeAsset = assets.filter(
    ({ address }) => !addressesEqual(address, nativeAssetPerChain[chain].address),
  );

  const assetsContractAddresses = assetsWithoutNativeAsset.map(({ address }) => address);

  try {
    const result = await etherspotService.fetchExchangeRates(chain, assetsContractAddresses);

    return mapWalletAndExchangePrices(result.items);
  } catch (error) {
    reportErrorLog('Fetch Rates failed: request error', {
      error,
      assetsContractAddresses,
    });
    return null;
  }
};

export const getNativeTokenPrice = async (chain: Chain): Promise<Rates | any> => {
  try {
    const result = await etherspotService.fetchExchangeRates(chain, [nativeAssetPerChain[chain]?.address]);

    return mapPricesToRates(result.items[0]);
  } catch (error) {
    reportErrorLog('Fetch Rates failed: request error', {
      error,
      chain,
    });
    return null;
  }
};

const mapPricesToRates = (prices: ExchangePriceEntry | any): Rates | any => {
  if (isEmpty(prices)) return null;
  return {
    USD: prices.usd,
    EUR: prices.eur,
    GBP: prices.gbp,
    ETH: prices.eth,
  };
};
