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

import { createSelector } from 'reselect';
import uniq from 'lodash.uniq';
import { getEnv } from 'configs/envConfig';
import { supportedAssetsSelector } from 'selectors/selectors';
import { getSendwyreCurrencyPairs } from 'utils/fiatToCrypto';
import { ETH, USD } from 'constants/assetsConstants';

import type { Assets, Asset } from 'models/Asset';
import type { Option } from 'models/Selector';
import type { RootReducerState } from 'reducers/rootReducer';

const defaultSource = USD;
const defaultDest = ETH;

const assetMapSelector = createSelector(
  supportedAssetsSelector,
  (supportedAssets: Asset[]) =>
    Object.fromEntries(supportedAssets.map(asset => [asset.symbol, asset])),
);

const sendwyreExchangeRatesSelector =
  ({ fiatToCrypto: { sendwyreExchangeRates } }: RootReducerState) => sendwyreExchangeRates;

export const currencyPairsSelector = createSelector(
  sendwyreExchangeRatesSelector,
  exchangeRates => getSendwyreCurrencyPairs(exchangeRates ?? {}),
);

const sourceSymbolsSelector = createSelector(
  currencyPairsSelector,
  currencyPairs => uniq(currencyPairs.map(([source]) => source)),
);

const destSymbolsSelector = createSelector(
  currencyPairsSelector,
  currencyPairs => uniq(currencyPairs.map(([, dest]) => dest)),
);

const assetOptionsSelector = (symbols: string[], assets: Assets): Option[] => {
  return symbols.map((symbol: string): Option => {
    const { name = symbol, iconUrl } = assets[symbol] ?? {
      iconUrl: `asset/images/fiat/ic_52_${symbol}.png`, // eslint-disable-line i18next/no-literal-string
    };

    const icon = iconUrl && `${getEnv().SDK_PROVIDER}/${iconUrl}`;

    return {
      symbol,
      value: symbol,
      name,
      icon,
      imageUrl: icon && `${icon}?size=3`,
    };
  });
};

export const sourceOptionsSelector = createSelector(
  sourceSymbolsSelector,
  assetMapSelector,
  assetOptionsSelector,
);

export const destOptionsSelector = createSelector(
  destSymbolsSelector,
  assetMapSelector,
  assetOptionsSelector,
);

const defaultCurrencySelector = (defaultSymbol: string) => (options: Option[]): Option | null =>
  options.find(({ symbol }) => symbol === defaultSymbol) ?? null;

export const defaultSourceSelector = createSelector(
  sourceOptionsSelector,
  defaultCurrencySelector(defaultSource),
);

export const defaultDestSelector = createSelector(
  destOptionsSelector,
  defaultCurrencySelector(defaultDest),
);
