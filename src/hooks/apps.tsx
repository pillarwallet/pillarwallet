// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

import { utils } from 'ethers';

// Constants
import { CHAIN } from 'constants/chainConstants';
import { USD } from 'constants/assetsConstants';

// Selectors
import { useFiatCurrency, useChainRates, useActiveAccount, useRootSelector, appsHoldingsSelector } from 'selectors';

// Utils
import { nativeAssetPerChain } from 'utils/chains';
import { isEtherspotAccount } from 'utils/accounts';
import { fiatInvestmentBalance } from 'utils/rates';

// Type
import { AppHoldings } from '../models/Investment';
import BigNumber from 'bignumber.js';

type Props = {
  appHoldings: AppHoldings[] | null;
  totalBalanceOfHoldings: number | any;
  isFetching: boolean;
};

export function useAppHoldings(): Props {
  const currency = useFiatCurrency();
  const activeAccount = useActiveAccount();
  const isEtherspotAcc = isEtherspotAccount(activeAccount);
  const { data: appsHoldingsData, isFetching } = useRootSelector(appsHoldingsSelector);

  const ethereumRates = useChainRates(CHAIN.ETHEREUM);
  const nativeAssetRate = ethereumRates[nativeAssetPerChain[CHAIN.ETHEREUM].address];

  if (!nativeAssetRate || !appsHoldingsData?.[0] || !isEtherspotAcc)
    return { appHoldings: null, totalBalanceOfHoldings: new BigNumber(0), isFetching };

  const appsHoldingsWithBalance: AppHoldings[] = appsHoldingsData.map((asset) => {
    const fiatBalance = fiatInvestmentBalance(asset.balance, ethereumRates, currency);

    return { ...asset, balance: fiatBalance };
  });

  appsHoldingsWithBalance.sort((a: AppHoldings, b: AppHoldings) => b?.balance - a?.balance);

  const sumOfBalance: number = appsHoldingsWithBalance.reduce((asset, value) => {
    return asset + (parseFloat(value.balance) || 0);
  }, 0);

  return { totalBalanceOfHoldings: sumOfBalance, appHoldings: appsHoldingsWithBalance, isFetching };
}
