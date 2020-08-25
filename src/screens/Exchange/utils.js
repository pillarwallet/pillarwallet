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

import { SDK_PROVIDER } from 'react-native-dotenv';
import isEmpty from 'lodash.isempty';
import { BigNumber } from 'bignumber.js';
import maxBy from 'lodash.maxby';
import Intercom from 'react-native-intercom';

import { getRate, getBalance, sortAssets } from 'utils/assets';
import { formatFiat, formatMoney, formatAmount, isValidNumber } from 'utils/common';
import { defaultFiatCurrency, ETH, POPULAR_EXCHANGE_TOKENS, BTC } from 'constants/assetsConstants';
import { EXCHANGE_INFO } from 'constants/navigationConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { getSmartWalletStatus, getDeploymentData } from 'utils/smartWallet';
import t from 'translations/translate';

import type { NavigationScreenProp } from 'react-navigation';
import type { Option, HorizontalOption } from 'models/Selector';
import type { Rates, Asset, Assets, Balances } from 'models/Asset';
import type { SmartWalletReducerState } from 'reducers/smartWalletReducer';
import type { Accounts } from 'models/Account';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Allowance, Offer } from 'models/Offer';
import type { ExchangeOptions } from 'utils/exchange';

export const getBalanceInFiat = (
  baseFiatCurrency: ?string,
  assetBalance: ?string | ?number,
  rates: Rates,
  symbol: string,
): number => {
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const assetBalanceInFiat = assetBalance ?
    parseFloat(assetBalance) * getRate(rates, symbol, fiatCurrency) : 0;
  return assetBalanceInFiat;
};

export const getAssetBalanceFromFiat = (
  baseFiatCurrency: ?string,
  fiatBalance: ?string | ?number,
  rates: Rates,
  symbol: string,
): number => {
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const assetBalanceFromFiat = fiatBalance ?
    parseFloat(fiatBalance) / getRate(rates, symbol, fiatCurrency) : 0;
  return assetBalanceFromFiat || 0;
};

export const getFormattedBalanceInFiat = (
  baseFiatCurrency: ?string,
  assetBalance: ?string | ?number,
  rates: Rates,
  symbol: string): string => {
  const assetBalanceInFiat = getBalanceInFiat(baseFiatCurrency, assetBalance, rates, symbol);
  if (!assetBalanceInFiat) return '';
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  return assetBalanceInFiat ? formatFiat(assetBalanceInFiat, fiatCurrency) : '';
};

export const getAvailable = (_min: string, _max: string, rate: string) => {
  if (!_min && !_max) {
    return 'N/A';
  }
  let min = (new BigNumber(rate)).multipliedBy(_min);
  let max = (new BigNumber(rate)).multipliedBy(_max);
  if ((min.gte(0) && min.lt(0.01)) || (max.gte(0) && max.lt(0.01))) {
    if (max.isZero()) return '>0.01';
    const maxAvailable = max.lt(0.01)
      ? '<0.01'
      : formatMoney(max.toNumber(), 2);
    return min.eq(max) || min.isZero()
      // max available displayed if equal to min or min is zero
      ? maxAvailable
      : '<0.01 - <0.01';
  }
  min = min.toNumber();
  max = max.toNumber();
  if (!min || !max || min === max) {
    return `${formatMoney(min || max, 2)}`;
  }
  return `${formatMoney(min, 2)} - ${formatMoney(max, 2)}`;
};

export const calculateAmountToBuy = (askRate: number | string, amountToSell: number | string) => {
  return (new BigNumber(askRate)).multipliedBy(amountToSell).toFixed();
};

export const getBestAmountToBuy = (offers: Offer[], fromAmount: string): ?string => {
  const bestRate = maxBy(offers, 'askRate')?.askRate;
  if (!bestRate || !fromAmount) return null;
  return calculateAmountToBuy(bestRate, fromAmount);
};

export const getFormattedSellMax = (asset: Option): string => {
  const { assetBalance, symbol, formattedBalanceInFiat } = asset;
  if (!(assetBalance && symbol && formattedBalanceInFiat)) return '';
  return `${formatAmount(assetBalance, 2)} ${symbol} (${formattedBalanceInFiat.replace(' ', '')})`;
};

export const validateInput = (
  fromAmount: string,
  fromAsset: ?Option,
  toAsset: ?Option,
  errorMessage: string,
): boolean =>
  !errorMessage && !!+fromAmount && fromAmount[fromAmount.length - 1] !== '.' && !!fromAsset && !!toAsset;

const generateAssetsOptions = (
  assets: Assets,
  exchangeSupportedAssets: Asset[],
  balances: Balances,
  baseFiatCurrency: ?string,
  rates: Rates,
): Option[] => {
  return sortAssets(assets)
    .filter(({ symbol }) => (getBalance(balances, symbol) !== 0 || symbol === ETH)
      && !!exchangeSupportedAssets.some(asset => asset.symbol === symbol))
    .map(({ symbol, iconUrl, ...rest }) => {
      const assetBalance = formatAmount(getBalance(balances, symbol));
      const formattedBalanceInFiat = getFormattedBalanceInFiat(baseFiatCurrency, assetBalance, rates, symbol);
      const imageUrl = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : '';

      return ({
        key: symbol,
        value: symbol,
        imageUrl,
        icon: iconUrl,
        iconUrl,
        symbol,
        ...rest,
        assetBalance,
        formattedBalanceInFiat,
        customProps: {
          balance: !!formattedBalanceInFiat && {
            balance: assetBalance,
            value: formattedBalanceInFiat,
            token: symbol,
          },
          rightColumnInnerStyle: { alignItems: 'flex-end' },
        },
      });
    });
};

const generateSupportedAssetsOptions = (
  exchangeSupportedAssets: Asset[],
  balances: Balances,
  baseFiatCurrency: ?string,
  rates: Rates,
): Option[] => {
  if (!Array.isArray(exchangeSupportedAssets)) return [];
  return exchangeSupportedAssets
    .map(({ symbol, iconUrl, ...rest }) => {
      const rawAssetBalance = getBalance(balances, symbol);
      const assetBalance = rawAssetBalance ? formatAmount(rawAssetBalance) : '';
      const formattedBalanceInFiat = getFormattedBalanceInFiat(baseFiatCurrency, assetBalance, rates, symbol);
      const imageUrl = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : '';

      return {
        key: symbol,
        value: symbol,
        icon: iconUrl,
        imageUrl,
        iconUrl,
        symbol,
        ...rest,
        assetBalance,
        formattedBalanceInFiat,
        customProps: {
          balance: !!formattedBalanceInFiat && {
            balance: assetBalance,
            value: formattedBalanceInFiat,
            token: symbol,
          },
          rightColumnInnerStyle: { alignItems: 'flex-end' },
        },
      };
    }).filter(asset => asset.key !== BTC);
};

const generatePopularOptions = (assetsOptionsBuying: Option[]): Option[] => {
  return POPULAR_EXCHANGE_TOKENS.reduce((popularAssetsList, popularSymbol) => {
    const popularAsset = assetsOptionsBuying.find(({ symbol }) => symbol === popularSymbol);
    if (popularAsset) return [...popularAssetsList, popularAsset];
    return popularAssetsList;
  }, []);
};

const generateHorizontalOptions = (assetsOptionsBuying: Option[]): HorizontalOption[] => {
  const popularOptions = generatePopularOptions(assetsOptionsBuying);
  return [{
    title: 'Popular',
    data: popularOptions,
  }];
};

export const provideOptions = (
  assets: Assets,
  exchangeSupportedAssets: Asset[],
  balances: Balances,
  rates: Rates,
  baseFiatCurrency: ?string,
): ExchangeOptions => {
  const assetsOptionsBuying = generateSupportedAssetsOptions(
    exchangeSupportedAssets,
    balances,
    baseFiatCurrency,
    rates,
  );
  const assetsOptionsFrom = generateAssetsOptions(
    assets,
    exchangeSupportedAssets,
    balances,
    baseFiatCurrency,
    rates,
  );
  return {
    fromOptions: assetsOptionsFrom,
    toOptions: assetsOptionsBuying,
    horizontalOptions: generateHorizontalOptions(assetsOptionsBuying), // the same for buy/sell
  };
};

const settingsIcon = require('assets/icons/icon_key.png');

export const getHeaderRightItems = (
  exchangeAllowances: Allowance[],
  hasUnreadExchangeNotification: boolean,
  navigation: NavigationScreenProp<*>,
  markNotificationAsSeen: () => void,
): Object[] => {
  const rightItems = [{ label: 'Support', onPress: () => Intercom.displayMessenger(), key: 'getHelp' }];
  if (!isEmpty(exchangeAllowances)
  && !rightItems.find(({ key }) => key === 'exchangeSettings')) {
    rightItems.push({
      iconSource: settingsIcon,
      indicator: hasUnreadExchangeNotification,
      key: 'exchangeSettings',
      onPress: () => {
        navigation.navigate(EXCHANGE_INFO);
        if (hasUnreadExchangeNotification) markNotificationAsSeen();
      },
    });
  }
  return rightItems;
};

const isEnoughAssetBalance = (assetBalance: ?string, amount: string | number) => Number(assetBalance) >= Number(amount);

export const getErrorMessage = (
  amount: string,
  asset: Option,
): string => {
  const { assetBalance = '', symbol = '' } = asset;
  const isValid = isValidNumber(amount);
  if (!isValid) {
    return t('error.exchange.incorrectNumber');
  } else if (!isEnoughAssetBalance(assetBalance, amount)) {
    return t('error.exchange.amountTooBig', { assetBalance, symbol });
  }
  return '';
};

export const shouldTriggerSearch = (
  fromAsset: Option,
  toAsset: Option,
  fromAmount: number,
) => fromAsset.value !== toAsset.value && isEnoughAssetBalance(fromAsset.assetBalance, fromAmount);

export const shouldBlockView = (smartWalletState: SmartWalletReducerState, accounts: Accounts): boolean => {
  const deploymentData = getDeploymentData(smartWalletState);
  const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
  const sendingBlockedMessage = smartWalletStatus.sendingBlockedMessage || {};
  return !isEmpty(sendingBlockedMessage)
    && smartWalletStatus.status !== SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED
    && !deploymentData.error;
};
