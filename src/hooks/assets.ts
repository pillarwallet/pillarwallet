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
import { useQuery } from 'react-query';

// Utils
import { useFromAssets } from 'screens/Bridge/Exchange-CrossChain/utils';
import { sum } from 'utils/number';
import { filteredWithDefaultAssets, filteredWithChain, filteredWithStableAssets } from 'utils/etherspot';
import { getChainsAssetsToAddress } from 'utils/assets';
import DefaultStableTokens from 'utils/tokens/stable-tokens.json';
import DefaultTokens from 'utils/tokens/tokens.json';

// Constants
import { TOKENS, STABLES, ALL } from 'constants/walletConstants';

// Selectors
import { useRootSelector, customTokensListSelector } from 'selectors';

// Type
import type { Chain } from 'models/Chain';

export function useStableAssets(chain?: Chain) {
  const fromAssets: any = useFromAssets();

  let assets = [...fromAssets];

  if (chain) {
    assets = filteredWithChain(assets, chain);
  }

  let tokens = filteredWithStableAssets(assets, DefaultStableTokens);

  if (!tokens?.[0])
    return {
      tokens: DefaultStableTokens,
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

  const filterStableDefaultTokens = filteredWithDefaultAssets(tokens, DefaultStableTokens);

  tokens = [...tokens, ...filterStableDefaultTokens];

  return { tokens, percentage: isNaN(percentage.toFixed(decimalNm)) ? 0 : percentage.toFixed(decimalNm) };
}

export function useNonStableAssets(chain?: Chain) {
  const fromAssets: any = useFromAssets();
  const { percentage: stablePercentage } = useStableAssets(chain);
  const customTokensList = useRootSelector(customTokensListSelector);

  let assets = [...fromAssets];
  if (chain) {
    assets = filteredWithChain(assets, chain);
  }

  let tokens = filteredWithDefaultAssets(DefaultStableTokens, assets);

  const percentage: number = 100 - stablePercentage;

  if (!tokens?.[0]) {
    const filteredCustomAssets = filteredWithDefaultAssets(DefaultTokens, customTokensList, chain);
    const totalTokens = [...DefaultTokens, ...filteredCustomAssets];
    return {
      tokens: totalTokens,
      percentage,
      totalPercentage: 100,
    };
  }

  tokens.sort((a, b) => b?.balance?.balanceInFiat - a?.balance?.balanceInFiat);

  const filterDefaultAssets = filteredWithDefaultAssets(tokens, DefaultTokens);

  tokens = [...tokens, ...filterDefaultAssets];

  const filteredCustomAssets = filteredWithDefaultAssets(tokens, customTokensList, chain);

  tokens = [...tokens, ...filteredCustomAssets];

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
        assets: nonStableAssets,
        totalBalance: sumOfAssetsBalance(assets),
      };
    const filterDefaultAssets = filteredWithDefaultAssets(assets, assets.concat(nonStableAssets));

    return { assets: assets.concat(filterDefaultAssets), totalBalance: sumOfAssetsBalance(assets) };
  }
  if (!chain && tabName === TOKENS) {
    return { assets: nonStableAssets, totalBalance: sumOfAssetsBalance(nonStableAssets) };
  }
  if (!chain && tabName === STABLES) {
    return { assets: stableAssets, totalBalance: sumOfAssetsBalance(stableAssets) };
  }

  if (tabName === ALL) {
    const filterAssets = filteredWithChain(assets, chain);

    if (isEmpty(filterAssets)) {
      const filterTokens = nonStableAssets?.filter((asset) => asset.chain === chain);
      return { assets: filterTokens, totalBalance: sumOfAssetsBalance(filterAssets) };
    }
    const filterDefaultAssets = filteredWithDefaultAssets(filterAssets, filterAssets.concat(nonStableAssets), chain);

    return { assets: filterAssets.concat(filterDefaultAssets), totalBalance: sumOfAssetsBalance(filterAssets) };
  }

  if (tabName === TOKENS) {
    const filterAssets = filteredWithChain(nonStableAssets, chain);
    return { assets: filterAssets, totalBalance: sumOfAssetsBalance(filterAssets) };
  }

  if (tabName === STABLES) {
    const filterAssets = filteredWithChain(stableAssets, chain);
    return { assets: filterAssets, totalBalance: sumOfAssetsBalance(filterAssets) };
  }

  return { assets, totalBalance: sumOfAssetsBalance(assets) };
}

export function useAssetsToAddress(supportedChain: Chain[], contractAddress: string): any {
  const enabled = !!supportedChain && !!contractAddress;

  return useQuery(
    ['useAssetsToAddress', supportedChain, contractAddress],
    () => getChainsAssetsToAddress(supportedChain, contractAddress),
    {
      enabled,
      cacheTime: 0,
    },
  );
}
