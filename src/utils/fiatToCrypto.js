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
import {
  RAMPNETWORK_WIDGET_URL,
  RAMPNETWORK_API_KEY,
} from 'react-native-dotenv';

import type { AltalixTrxParams, SendwyreRates, SendwyreTrxParams } from 'models/FiatToCryptoProviders';
import type SDKWrapper from 'services/api';

export function rampWidgetUrl(address: string, email?: string) {
  const params = {
    swapAsset: 'PLR', // This turns on the ability to purchase PLR
    hostApiKey: RAMPNETWORK_API_KEY,
    userAddress: address,
    ...(email ? { userEmailAddress: email } : {}),
  };

  return `${RAMPNETWORK_WIDGET_URL}?${querystring.stringify(params)}`;
}

export const wyreWidgetUrl = async (params: SendwyreTrxParams, api: SDKWrapper) =>
  api.getSendwyreWidgetURL(params);

type Rate = $Values<SendwyreRates>;
type CurrencyPair = [string, string];

function rateToCurrencyPair([joint, split]: [string, Rate]): CurrencyPair {
  const [a, b] = ((Object.keys(split): any): [string, string]);
  return a + b === joint ? [a, b] : [b, a];
}

export const getSendwyreCurrencyPairs = (rates: SendwyreRates): CurrencyPair[] =>
  ((Object.entries(rates): any): [string, Rate][])
    .map(rateToCurrencyPair);

export const altalixWidgetUrl = (params: AltalixTrxParams, api: SDKWrapper) =>
  api.generateAltalixTransactionUrl(params);
