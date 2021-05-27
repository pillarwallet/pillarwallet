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

import isEmpty from 'lodash.isempty';
import { BigNumber } from 'bignumber.js';
import maxBy from 'lodash.maxby';
import Instabug from 'instabug-reactnative';

import { getRate, getBalance, sortAssets, getAssetOption } from 'utils/assets';
import { formatMoney } from 'utils/common';
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { EXCHANGE_INFO } from 'constants/navigationConstants';
import { ARCHANOVA_WALLET_UPGRADE_STATUSES } from 'constants/archanovaConstants';
import { getArchanovaWalletStatus, getDeploymentData } from 'utils/archanova';
import { calculateAmountToBuy } from 'utils/exchange';
import t from 'translations/translate';

import type { NavigationScreenProp } from 'react-navigation';
import type { Rates, Asset, Assets, AssetOption } from 'models/Asset';
import type { SmartWalletReducerState } from 'reducers/smartWalletReducer';
import type { Accounts } from 'models/Account';
import type { ArchanovaWalletStatus } from 'models/ArchanovaWalletStatus';
import type { Allowance, Offer } from 'models/Offer';
import type { ExchangeOptions } from 'utils/exchange';
import type { WalletAssetsBalances } from 'models/Balances';

/* eslint-disable i18next/no-literal-string */

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

export const getAvailable = (_min: string, _max: string, rate: string) => {
  if (!_min && !_max) {
    return t('label.notApplicable');
  }
  let min = (new BigNumber(rate)).multipliedBy(_min);
  let max = (new BigNumber(rate)).multipliedBy(_max);
  if ((min.gte(0) && min.lt(0.01)) || (max.gte(0) && max.lt(0.01))) {
    if (max.isZero()) return t('moreThanSignValue', { value: '0.01' });
    const maxAvailable = max.lt(0.01)
      ? t('lessThanSignValue', { value: '0.01' })
      : formatMoney(max.toNumber(), 2);
    return min.eq(max) || min.isZero()
      // max available displayed if equal to min or min is zero
      ? maxAvailable
      : t('rangeValues', {
        fromValue: t('lessThanSignValue', { value: '0.01' }),
        toValue: t('lessThanSignValue', { value: '0.01' }),
      });
  }
  min = min.toNumber();
  max = max.toNumber();
  if (!min || !max || min === max) {
    return `${formatMoney(min || max, 2)}`;
  }
  return `${formatMoney(min, 2)} - ${formatMoney(max, 2)}`;
};

export const getBestAmountToBuy = (offers: Offer[], fromAmount: string): ?string => {
  const bestRate = maxBy(offers, 'askRate')?.askRate;
  if (!bestRate || !+fromAmount) return null;
  return calculateAmountToBuy(bestRate, fromAmount);
};

export const validateInput = (
  fromAmount: string,
  fromAsset: ?AssetOption,
  toAsset: ?AssetOption,
): boolean =>
  !!+fromAmount && fromAmount[fromAmount.length - 1] !== '.' && !!fromAsset && !!toAsset;

const getExchangeFromAssetOptions = (
  assets: Assets,
  exchangeSupportedAssets: Asset[],
  balances: WalletAssetsBalances,
  baseFiatCurrency: ?string,
  rates: Rates,
): AssetOption[] => {
  const isMatching = (asset: Asset) => (asset.symbol === ETH || getBalance(balances, asset.symbol) !== 0);
  const isSupported = (asset: Asset) =>
    exchangeSupportedAssets.some((supportedAsset) => asset.symbol === supportedAsset.symbol);

  return sortAssets(assets)
    .filter((asset) => isMatching(asset) && isSupported(asset))
    .map((asset) => getAssetOption(asset, balances, rates, baseFiatCurrency));
};

const getExchangeToAssetOptions = (
  exchangeSupportedAssets: Asset[],
  balances: WalletAssetsBalances,
  baseFiatCurrency: ?string,
  rates: Rates,
): AssetOption[] => {
  if (!Array.isArray(exchangeSupportedAssets)) return [];

  return exchangeSupportedAssets
    .map((asset) => getAssetOption(asset, balances, rates, baseFiatCurrency));
};

export const provideOptions = (
  assets: Assets,
  exchangeSupportedAssets: Asset[],
  balances: WalletAssetsBalances,
  rates: Rates,
  baseFiatCurrency: ?string,
): ExchangeOptions => {
  const assetsOptionsFrom = getExchangeFromAssetOptions(
    assets,
    exchangeSupportedAssets,
    balances,
    baseFiatCurrency,
    rates,
  );

  const assetsOptionsTo = getExchangeToAssetOptions(
    exchangeSupportedAssets,
    balances,
    baseFiatCurrency,
    rates,
  );

  return {
    fromOptions: assetsOptionsFrom,
    toOptions: assetsOptionsTo,
  };
};

const settingsIcon = require('assets/icons/icon_key.png');

export const getHeaderRightItems = (
  exchangeAllowances: Allowance[],
  hasUnreadExchangeNotification: boolean,
  navigation: NavigationScreenProp<*>,
  markNotificationAsSeen: () => void,
): Object[] => {
  const rightItems = [{ label: t('button.support'), onPress: () => Instabug.show(), key: 'getHelp' }];
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

const isEnoughAssetBalance = (assetBalance: ?string, amount: string): boolean => {
  try {
    const amountBN = new BigNumber(amount);
    const balanceBN = new BigNumber(assetBalance ?? 0);
    // assetBalance is fixed to 6 digits and amount is not, so usually amount will be technically higher
    // fix and round both down to 6 to get meaningful info
    const amountFixed = amountBN.toFixed(6, 1);
    const balanceFixed = balanceBN.toFixed(6, 1);
    return new BigNumber(balanceFixed).isGreaterThanOrEqualTo(new BigNumber(amountFixed));
  } catch {
    return false;
  }
};

export const shouldTriggerSearch = (
  fromAsset: AssetOption,
  toAsset: AssetOption,
  fromAmount: string,
) => !!+fromAmount && fromAsset.symbol !== toAsset.symbol && isEnoughAssetBalance(fromAsset.assetBalance, fromAmount);

export const shouldBlockView = (smartWalletState: SmartWalletReducerState, accounts: Accounts): boolean => {
  const deploymentData = getDeploymentData(smartWalletState);
  const archanovaWalletStatus: ArchanovaWalletStatus = getArchanovaWalletStatus(accounts, smartWalletState);
  const sendingBlockedMessage = archanovaWalletStatus.sendingBlockedMessage || {};
  return !isEmpty(sendingBlockedMessage)
    && archanovaWalletStatus.status !== ARCHANOVA_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED
    && !deploymentData.error;
};

export const getToOption =
  (symbol: string, options: ExchangeOptions): AssetOption => options.toOptions.find(a => a.symbol === symbol) || {};

export const shouldResetAndTriggerSearch = (
  fromAmount: string,
  prevFromAmount: string,
  fromAsset: AssetOption,
  prevFromAsset: AssetOption,
  toAsset: AssetOption,
  prevToAsset: AssetOption,
): boolean => {
  // valid input provided or asset changed
  return (fromAsset !== prevFromAsset || toAsset !== prevToAsset || fromAmount !== prevFromAmount) &&
    validateInput(fromAmount, fromAsset, toAsset) &&
    shouldTriggerSearch(fromAsset, toAsset, fromAmount);
};
