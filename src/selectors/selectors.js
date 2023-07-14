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

import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { get } from 'lodash';

// constants
import { ADDRESS_ZERO, defaultFiatCurrency, USD } from 'constants/assetsConstants';

// utils
import { isEtherspotAccount, getAccountAddress } from 'utils/accounts';
import { valueForAddress, EMPTY_OBJECT, EMPTY_ARRAY } from 'utils/common';

// types
import type { RootReducerState } from 'reducers/rootReducer';
import type { Asset, AssetsPerChain } from 'models/Asset';
import type { Account } from 'models/Account';
import type { Chain } from 'models/Chain';

export type Selector<Result, Props = void> = (state: RootReducerState, props?: Props) => Result;

export const useRootSelector = <T>(selector: (state: RootReducerState) => T): T =>
  useSelector((root: RootReducerState) => selector(root));

// Most commonly used selectors
export const useFiatCurrency = () => useRootSelector(fiatCurrencySelector);
export const useRatesPerChain = () => useRootSelector(ratesPerChainSelector);

export const useChainRates = (chain: ?Chain) => {
  const ratesPerChain = useRatesPerChain();

  if (!chain) return EMPTY_OBJECT;
  return ratesPerChain[chain] ?? EMPTY_OBJECT;
};

export const useSupportedAssetsPerChain = () => useRootSelector(supportedAssetsPerChainSelector);

export const useChainSupportedAssets = (chain: ?Chain): Asset[] => {
  const supportedAssetPerChain = useSupportedAssetsPerChain();
  if (!chain) return EMPTY_ARRAY;

  return supportedAssetPerChain[chain] ?? EMPTY_ARRAY;
};

export const useTransactionNotification = () => useRootSelector((root) => root.transactionNotification.data);

export const useGasInfoPerChain = () => useRootSelector((root) => root.history.gasInfo);
export const useChainGasInfo = (chain: Chain) => useGasInfoPerChain()[chain];
export const useNftFlag = () => useRootSelector((root) => root.nftFlag.visible);
export const useOnboardingFetchingSelector = () => useRootSelector(onboardingFetchingSelector);
export const useOnboardingLoaderMessageSelector = () => useRootSelector(onboardingLoaderMessageSelector);

//
// Global selectors here
//

export const fiatCurrencySelector = (root: RootReducerState) =>
  root.appSettings.data.baseFiatCurrency ?? defaultFiatCurrency;

export const historySelector = ({ history }: RootReducerState) => history.data;

export const onboardingFetchingSelector = ({ onboarding }: RootReducerState) => onboarding.isFetching;
export const onboardingLoaderMessageSelector = ({ onboarding }: RootReducerState) => onboarding.loaderMessage;

export const appsHoldingsSelector = ({ appsHoldings }: RootReducerState) => appsHoldings;

export const useAppHoldings = () => useRootSelector((root) => root.appsHoldings);

export const defaultTokensSelector = ({ defaultTokens }: RootReducerState) => defaultTokens;

export const addTokensListSelector = ({ addTokensList }: RootReducerState) => addTokensList;

export const customTokensListSelector = ({ customTokensList }: RootReducerState) => customTokensList?.data;

export const bannerDataSelector = ({ onboarding }: RootReducerState) => onboarding.bannerData;

export const viewedReceiveTokensWarningSelector = ({ onboarding }: RootReducerState) =>
  onboarding.viewedReceiveTokensWarning;

export const paymentNetworkBalancesSelector = ({ paymentNetwork }: RootReducerState) => paymentNetwork.balances;

export const accountsSelector = ({ accounts }: RootReducerState) => accounts.data;

export const activeAccountSelector = ({ accounts }: RootReducerState) => accounts.data.find(({ isActive }) => isActive);

export const activeAccountIdSelector: Selector<string> = createSelector(activeAccountSelector, (activeAccount) =>
  activeAccount ? activeAccount.id : null,
);

export const activeAccountAddressSelector = createSelector(activeAccountSelector, (activeAccount) =>
  activeAccount ? getAccountAddress(activeAccount) : '',
);

export const syntheticAssetsSelector = ({ synthetics }: RootReducerState) => synthetics.data;

export const supportedAssetsPerChainSelector = (root: RootReducerState): AssetsPerChain =>
  root.assets?.supportedAssets ?? EMPTY_OBJECT;

export const exchangeGasFeeSelector = (root: RootReducerState) => root.exchangeGasFee.data;

export const useExchangeGasFee = () => useRootSelector(exchangeGasFeeSelector);

export const activeBlockchainSelector = ({ appSettings }: RootReducerState) =>
  get(appSettings, 'data.blockchainNetwork', 'Ethereum');

export const themeSelector = ({ appSettings }: RootReducerState) => appSettings.data.themeType;

export const biometricSelector = ({ appSettings }: RootReducerState) => appSettings.data.useBiometrics;

export const ratesPerChainSelector = ({ rates }: RootReducerState) => rates.data;

export const ethereumRatesSelector = (root: RootReducerState) => root.rates.data?.ethereum ?? EMPTY_OBJECT;

export const contactsSelector = ({ contacts }: RootReducerState) => contacts.data;

export const liquidityPoolsSelector = ({ liquidityPools }: RootReducerState) => liquidityPools;

export const useAccounts = (): Account[] => useRootSelector(accountsSelector);

export const useActiveAccount = (): ?Account => useRootSelector(activeAccountSelector);

export const useIsExchangeAvailable = (): boolean => {
  const account = useActiveAccount();
  return isEtherspotAccount(account);
};

/**
 * Returns exchange rate from USD to user's fiat currency.
 */
export const usdToFiatRateSelector = (root: RootReducerState) => {
  const rates = ratesPerChainSelector(root).ethereum;
  const currency = fiatCurrencySelector(root);

  // No need to calculate rate for USD/USD.
  if (currency === USD) return 1;

  // will select native asset rates to calculate between
  const nativeAssetRates = valueForAddress(rates, ADDRESS_ZERO);
  if (!nativeAssetRates || !nativeAssetRates[currency] || !nativeAssetRates[USD]) {
    return 0;
  }

  return nativeAssetRates[currency] / nativeAssetRates[USD];
};

export const useUsdToFiatRate = () => useRootSelector(usdToFiatRateSelector);
