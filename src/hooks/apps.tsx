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

import * as React from 'react';
import { utils } from 'ethers';

// Constants
import { CHAIN } from 'constants/chainConstants';
import { USD } from 'constants/assetsConstants';

// Services
import { getNativeTokenPrice } from 'services/rates';
import etherspotService from 'services/etherspot';

// Selectors
import { useFiatCurrency, useActiveAccount, useChainRates } from 'selectors';

// Utils
import { nativeAssetPerChain } from 'utils/chains';
import { getAssetValueInFiat } from 'utils/rates';

// Type
import { AppHoldings } from '../models/Investment';

type Props = {
  appHoldings: AppHoldings[] | null;
  totalBalanceOfHoldings: number | any;
};

export function useAppHoldings(): Props {
  const [assetRate, setAssetRate] = React.useState(null);
  const currency = useFiatCurrency();
  const activeAccount = useActiveAccount();
  const [arrOfHoldings, setArrOfHoldings] = React.useState([]);
  const ethereumRates = useChainRates(CHAIN.ETHEREUM);

  React.useEffect(() => {
    const call = async () => {
      setAssetRate(ethereumRates[nativeAssetPerChain[CHAIN.ETHEREUM].address]);
      const res = await etherspotService.getAccountInvestments(CHAIN.POLYGON, activeAccount.address);
      setArrOfHoldings(res.items);
    };
    if (!arrOfHoldings?.[0]) call();
  });

  if (!assetRate || !arrOfHoldings?.[0]) return { appHoldings: null, totalBalanceOfHoldings: 0 };

  const appsHoldingsWithBalance: AppHoldings[] = arrOfHoldings?.map((asset) => {
    const assetBalance: string = utils.formatEther(asset.balance);

    const fiatAmount = (parseFloat(assetBalance) * assetRate?.[currency]) / assetRate?.[USD];

    return { ...asset, balance: fiatAmount.toFixed(2) };
  });

  appsHoldingsWithBalance?.sort((a: AppHoldings, b: AppHoldings) => b?.balance - a?.balance);

  const topFiveHoldings = appsHoldingsWithBalance.slice(0, 5);

  const sumOfBalance: number = topFiveHoldings.reduce((asset, value) => {
    return asset + (parseFloat(value.balance) || 0);
  }, 0);

  return { totalBalanceOfHoldings: sumOfBalance, appHoldings: appsHoldingsWithBalance.slice(0, 5) };
}
