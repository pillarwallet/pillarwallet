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
import { useFiatCurrency, useActiveAccount } from 'selectors';

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

  React.useEffect(() => {
    const call = async () => {
      const nativeAssetPrice = await getNativeTokenPrice(CHAIN.POLYGON);
      await etherspotService.getAccountInvestments(CHAIN.POLYGON, activeAccount.address);
      setAssetRate(nativeAssetPrice);
    };
    if (!assetRate) call();
  });

  if (!assetRate) return { appHoldings: null, totalBalanceOfHoldings: 0 };

  const appsHoldingsWithBalance: AppHoldings[] = APP_HOLDINGS.map((asset) => {
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

const APP_HOLDINGS = [
  {
    name: 'Loopring',
    balance: '0x066df7138b262000',
    network: 'ethereum',
    position: 1,
    logoURI: 'https://storage.googleapis.com/zapper-fi-assets/apps/loopring.png',
  },
  {
    name: 'Reflexer',
    balance: '0x0178f9c9b7c621789c5900',
    network: 'ethereum',
    position: 1,
    logoURI: 'https://storage.googleapis.com/zapper-fi-assets/apps/reflexer.png',
  },
  {
    name: 'Sablier',
    balance: '0x2b85a46a9b2cb4bcc0',
    network: 'ethereum',
    position: 25,
    logoURI: 'https://storage.googleapis.com/zapper-fi-assets/apps/sablier.png',
  },
  {
    name: 'Uniswap V2',
    balance: '0xff0c27ad1a1b487040',
    network: 'ethereum',
    position: 4,
    logoURI: 'https://storage.googleapis.com/zapper-fi-assets/apps/uniswap-v2.png',
  },
  {
    name: 'Aave V2',
    balance: '0x0344afff2e80a32fa0',
    network: 'ethereum',
    position: 3,
    logoURI: 'https://storage.googleapis.com/zapper-fi-assets/apps/aave-v2.png',
  },
];
