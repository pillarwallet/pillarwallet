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
import { useTranslation } from 'translations/translate';

// Constants
import { LENDING_ADD_DEPOSIT_FLOW, RARI_DEPOSIT } from 'constants/navigationConstants';

// Selectors
import { useRootSelector } from 'selectors';
import { depositsBalanceSelector } from 'selectors/balances';

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
  change?: BigNumber,
  currentApy?: BigNumber,
|};


// TODO: provide real assets data
export function useDepositsAssets(): ChainRecord<DepositItem[]> {
  const ethereum = [
    {
      key: 'rari-1',
      title: 'Stable pool',
      service: 'Rari',
      iconSource: rariIcon,
      value: BigNumber(10),
      change: BigNumber(1.2),
      currentApy: BigNumber(0.012),
    },
    {
      key: 'rari-2',
      title: 'Yield pool',
      service: 'Rari',
      iconSource: rariIcon,
      value: BigNumber(15),
      change: BigNumber(5),
      currentApy: BigNumber(0.023),
    },
    {
      key: 'aave-1',
      title: 'AAVE Pool 1',
      service: 'Aave',
      iconSource: aaveIcon,
      value: BigNumber(10),
      change: BigNumber(1.2),
      currentApy: BigNumber(0.034),
    },
  ];

  const polygon = [
    {
      key: 'rari-3',
      title: 'Stable pool',
      service: 'Rari',
      iconSource: rariIcon,
      value: BigNumber(10),
      change: BigNumber(1.2),
      currentApy: BigNumber(0.045),
    },
  ];

  return { ethereum, polygon };
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
    { title: t('apps.aave'), iconSource: aaveIcon, navigationPath: LENDING_ADD_DEPOSIT_FLOW },
    { title: t('apps.rari'), iconSource: rariIcon, navigationPath: RARI_DEPOSIT },
  ];
}
