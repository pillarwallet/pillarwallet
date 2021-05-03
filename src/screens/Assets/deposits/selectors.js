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

import { BigNumber } from 'bignumber.js';
import { useNavigation } from 'react-navigation-hooks';
import { useTranslation } from 'translations/translate';

// Constants
import { LENDING_CHOOSE_DEPOSIT, LENDING_VIEW_DEPOSITED_ASSET, RARI_DEPOSIT } from 'constants/navigationConstants';
import { RARI_POOLS } from 'constants/rariConstants';

// Selectors
import { useRootSelector, useRates, useFiatCurrency } from 'selectors';
import { depositsBalanceSelector } from 'selectors/balances';

// Services
import { usePoolCurrentApys } from 'services/rariSdk';

// Utils
import { convertUSDToFiat, getBalanceInFiat } from 'utils/assets';
import { wrapBigNumber } from 'utils/common';

// Types
import type { ImageSource } from 'utils/types/react-native';
import type { ChainRecord } from 'models/Chain';
import type { FiatBalance } from 'models/Value';

const aaveIcon = require('assets/images/apps/aave.png');
const rariIcon = require('assets/images/rari_logo.png');

export function useDepositsBalance(): FiatBalance {
  const value = useRootSelector(depositsBalanceSelector);
  return { value };
}
export type DepositItem = {|
  key: string,
  service: string,
  title: string,
  iconSource: ImageSource,
  value: BigNumber,
  interests?: BigNumber,
  currentApy?: BigNumber,
  navigateAction?: () => mixed,
|};


// TODO: provide real assets data
export function useDepositsAssets(): ChainRecord<DepositItem[]> {
  const aaveDeposits = useAaveDeposits();
  const rariDeposits = useRariDeposits();
  const ethereum = [...aaveDeposits, ...rariDeposits];
  return { ethereum };
}

function useAaveDeposits(): DepositItem[] {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const deposits = useRootSelector((root) => root.lending.depositedAssets);
  const rates = useRates();
  const currency = useFiatCurrency();

  return deposits
    .map((deposit) => {
      const value = getBalanceInFiat(currency, deposit.currentBalance, rates, deposit.symbol);
      const interests = getBalanceInFiat(currency, deposit.earnedAmount, rates, deposit.symbol);
      return {
        key: deposit.aaveTokenAddress,
        title: deposit.name,
        service: t('apps.aave'),
        iconSource: aaveIcon,
        value: wrapBigNumber(value),
        interests: wrapBigNumber(interests),
        currentApy: BigNumber(deposit.earnInterestRate / 100),
        navigateAction: () => navigation.navigate(LENDING_VIEW_DEPOSITED_ASSET, { depositedAsset: deposit }),
      };
    });
}

function useRariDeposits(): DepositItem[] {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const deposits = useRootSelector((root) => root.rari.userDepositInUSD);
  const userInterests = useRootSelector((root) => root.rari.userInterests);
  const rates = useRates();
  const currency = useFiatCurrency();
  const currentApys = usePoolCurrentApys();

  const titles = {
    [RARI_POOLS.STABLE_POOL]: t('rariContent.depositsList.stablePool'),
    [RARI_POOLS.YIELD_POOL]: t('rariContent.depositsList.yieldPool'),
    [RARI_POOLS.ETH_POOL]: t('rariContent.depositsList.ethPool'),
  };

  return Object.keys(deposits)
    .filter((pool) => !!deposits[pool])
    .map((pool) => {
      const fiatValue = convertUSDToFiat(deposits[pool], rates, currency);
      const fiatChange = convertUSDToFiat(userInterests[pool]?.interests ?? 0, rates, currency);
      return {
        key: pool,
        title: titles[pool],
        service: t('apps.rari'),
        iconSource: rariIcon,
        value: BigNumber(fiatValue),
        interests: BigNumber(fiatChange),
        currentApy: currentApys[pool],
        navigateAction: () => navigation.navigate(RARI_DEPOSIT),
      };
    });
}

export type DepositApp = {|
  title: string,
  subtitle?: string,
  iconSource: ImageSource,
  navigationPath: string,
|};

export function useDepositApps(): DepositApp[] {
  const { t } = useTranslation();

  return [
    { title: t('apps.aave'), iconSource: aaveIcon, navigationPath: LENDING_CHOOSE_DEPOSIT },
    { title: t('apps.rari'), iconSource: rariIcon, navigationPath: RARI_DEPOSIT },
  ];
}
