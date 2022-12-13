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
import NonStableTokens from 'utils/tokens/tokens.json';
import StableTokens from 'utils/tokens/stable-tokens.json';

export const useStableAssets = () => {
  const listOfStableToken = useRootSelector(stableTokensSelector);
  const assets: any = useFromAssets();

  const tokens = assets?.filter((assetToken) =>
    listOfStableToken.some((stableToken) => isSame(assetToken, stableToken)),
  );

  if (!tokens?.[0])
    return {
      tokens: StableTokens,
      percentage: !assets?.[0] ? 50 : 0,
    };

  const sumOfAssetsBalance: number = assets.reduce((balance, token) => {
    return balance + (parseFloat(token.balance.balanceInFiat) || 0);
  }, 0);

  const sumOfStableTokensBalance: number = tokens.reduce((balance, token) => {
    return balance + (parseFloat(token.balance.balanceInFiat) || 0);
  }, 0);

  const percentage: any = ((sumOfStableTokensBalance * 100) / sumOfAssetsBalance).toFixed(0);

  tokens.sort((a, b) => b?.balance?.balanceInFiat - a?.balance?.balanceInFiat);

  return { tokens, percentage: isNaN(percentage) ? 0 : percentage };
};

export const useNonStableAssets = () => {
  const assets: any = useFromAssets();
  const listOfStableToken = useRootSelector(stableTokensSelector);
  const { percentage: stablePercentage } = useStableAssets();

  const tokens = assets?.filter(
    (assetToken) => !listOfStableToken.some((stableToken) => isSame(assetToken, stableToken)),
  );

  const percentage: number = 100 - stablePercentage;

  if (!tokens?.[0])
    return {
      tokens: NonStableTokens,
      percentage,
      totalPercentage: 100,
    };

  tokens.sort((a, b) => b?.balance?.balanceInFiat - a?.balance?.balanceInFiat);

  return { tokens, percentage, totalPercentage: isNaN(percentage) ? 0 : percentage };
};

const isSame = (a, b) => a.symbol === b.symbol && a.address === b.address;
