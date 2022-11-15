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

// Selectors
import { stableTokensSelector, useRootSelector } from 'selectors';

// Utils
import { useFromAssets } from 'screens/Bridge/Exchange-CrossChain/utils';

export const useStableAssets = () => {
  const listOfStableToken = useRootSelector(stableTokensSelector);
  const assets: any = useFromAssets();

  if (!listOfStableToken || !assets?.[0])
    return {
      tokens: [],
      percentage: 0,
    };

  const tokens = assets.filter((assetToken) =>
    listOfStableToken.some((stableToken) => isSame(assetToken, stableToken)),
  );

  const percentage: any = ((tokens.length * 100) / assets.length).toFixed(0);

  tokens.sort((a, b) => b?.balance?.balanceInFiat - a?.balance?.balanceInFiat);

  return { tokens, percentage: isNaN(percentage) ? 0 : percentage };
};

export const useNonStableAssets = () => {
  const assets: any = useFromAssets();
  const listOfStableToken = useRootSelector(stableTokensSelector);
  const { tokens: stableToken } = useStableAssets();

  if (!stableToken && !assets?.[0])
    return {
      tokens: [],
      percentage: 0,
      totalPercentage: 0,
    };

  const tokens = assets.filter(
    (assetToken) => !listOfStableToken.some((stableToken) => isSame(assetToken, stableToken)),
  );

  const percentage: any = ((tokens.length * 100) / assets.length).toFixed(0);

  tokens.sort((a, b) => b?.balance?.balanceInFiat - a?.balance?.balanceInFiat);

  return { tokens, percentage, totalPercentage: isNaN(percentage) ? 0 : percentage };
};

const isSame = (a, b) => a.symbol === b.symbol && a.address === b.address;
