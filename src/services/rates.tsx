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

// Types
import type { Asset } from 'models/Asset';
import type { Rates, RatesByAssetAddress } from 'models/Rates';
import type { Chain } from 'models/Chain';

//  Local
import etherspotService from './etherspot';

const allSettled = require('promise.allsettled');

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

export const getExchangeTokenPrices = async (
  chain: Chain,
  assets: Asset[],
  callBack: (rates: any) => void,
): Promise<RatesByAssetAddress | any> => {
  const assetsContractAddresses = assets.map(({ address }) => address);

  if (isEmpty(assetsContractAddresses)) {
    return;
  }
  allSettled.shim();
  const promiseRequest = () => {
    return new Promise(() => {
      (async () => {
        try {
          const result = await etherspotService.fetchExchangeRates(chain, assetsContractAddresses);
          await callBack(mapWalletAndExchangePrices(result.items));
        } catch (error) {
          reportErrorLog('Fetch Rates failed: request error', {
            error,
            assetsContractAddresses,
          });
        }
      })();
    });
  };

  allSettled([promiseRequest()]);

  return;
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
