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
import isEmpty from 'lodash.isempty';

// Selectors
import { stableTokensSelector, useRootSelector } from 'selectors';

// Utils
import { useFromAssets } from 'screens/Bridge/Exchange-CrossChain/utils';
import NonStableTokens from 'utils/tokens/tokens.json';
import StableTokens from 'utils/tokens/stable-tokens.json';
import { sum } from 'utils/number';
import { isSame } from 'utils/assets'

// Constants
import { TOKENS, STABLES, ALL } from 'constants/walletConstants';

// Type
import type { Chain } from 'models/Chain';

export function useStableAssets(chain?: Chain) {
  const fromAssets: any = useFromAssets();
  const listOfStableToken = useRootSelector(stableTokensSelector);

  let assets = [...fromAssets];

  if (chain) {
    assets = assets?.filter((token) => token.chain === chain);
  }

  let tokens = assets?.filter((assetToken) => listOfStableToken.some((stableToken) => isSame(assetToken, stableToken)));

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

  const percentage: any = (sumOfStableTokensBalance * 100) / sumOfAssetsBalance;

  const decimalNm: number = percentage > 99 || percentage < 1 ? 2 : 0;

  tokens.sort((a, b) => b?.balance?.balanceInFiat - a?.balance?.balanceInFiat);

  return { tokens, percentage: isNaN(percentage.toFixed(decimalNm)) ? 0 : percentage.toFixed(decimalNm) };
}

export function useNonStableAssets(chain?: Chain) {
  const fromAssets: any = useFromAssets();
  const listOfStableToken = useRootSelector(stableTokensSelector);
  const { percentage: stablePercentage } = useStableAssets(chain);

  let assets = [...fromAssets];
  if (chain) {
    assets = assets?.filter((token) => token.chain === chain);
  }

  let tokens = assets?.filter(
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
}

export function useFilteredAssets(chain: Chain | null, tabName: string) {
  const assets: any = useFromAssets();
  const { tokens: nonStableAssets } = useNonStableAssets();
  const { tokens: stableAssets } = useStableAssets();

  assets?.sort((a, b) => b?.balance?.balanceInFiat - a?.balance?.balanceInFiat);

  const sumOfAssetsBalance = (assets) => {
    if (isEmpty(assets)) return 0;

    const balanceList = assets?.map((asset) => asset?.balance?.balanceInFiat);
    return sum(balanceList);
  };

  if (!chain && tabName === ALL) {
    if (isEmpty(assets))
      return {
        assets: stableAssets.concat(nonStableAssets),
        totalBalance: sumOfAssetsBalance(assets),
      };
    return { assets, totalBalance: sumOfAssetsBalance(assets) };
  }
  if (!chain && tabName === TOKENS) {
    return { assets: nonStableAssets, totalBalance: sumOfAssetsBalance(nonStableAssets) };
  }
  if (!chain && tabName === STABLES) {
    return { assets: stableAssets, totalBalance: sumOfAssetsBalance(stableAssets) };
  }

  if (tabName === ALL) {
    const filterAssets = assets?.filter((asset) => asset.chain === chain);
    if (isEmpty(filterAssets)) {
      const filterTokens = nonStableAssets?.filter((asset) => asset.chain === chain);
      const filterStables = stableAssets?.filter((asset) => asset.chain === chain);
      return { assets: filterTokens?.concat(filterStables), totalBalance: sumOfAssetsBalance(filterAssets) };
    }
    return { assets: filterAssets, totalBalance: sumOfAssetsBalance(filterAssets) };
  }

  if (tabName === TOKENS) {
    const filterAssets = nonStableAssets?.filter((asset) => asset.chain === chain);
    return { assets: filterAssets, totalBalance: sumOfAssetsBalance(filterAssets) };
  }

  if (tabName === STABLES) {
    const filterAssets = stableAssets?.filter((asset) => asset.chain === chain);
    return { assets: filterAssets, totalBalance: sumOfAssetsBalance(filterAssets) };
  }

  return { assets, totalBalance: sumOfAssetsBalance(assets) };
}
