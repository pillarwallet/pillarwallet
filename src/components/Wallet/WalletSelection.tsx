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

import React, { useState } from 'react';
import { FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { BigNumber } from 'bignumber.js';

// Hooks
import { useStableAssets, useNonStableAssets } from 'hooks/assets';
import { useChainsConfig } from 'utils/uiConfig';

// Components
import ButtonGroup from 'components/layout/ButtonGroup';
import { Spacing } from 'components/legacy/Layout';
import TokenListItem from 'components/lists/TokenListItem';
import Icon from 'components/core/Icon';
import HorizontalProgressBar from 'components/Progress/HorizontalProgressBar';
import ChainListItem from 'screens/Home/components/ChainListItem';

// Constants
import { TOKENS, STABLES } from 'constants/walletConstants';
import { ASSET } from 'constants/navigationConstants';

// Utils
import { useThemeColors } from 'utils/themes';
import { wrapBigNumberOrNil } from 'utils/bigNumber';
import { buildAssetDataNavigationParam } from 'screens/Assets/utils';
import { formatFiatValue } from 'utils/format';

// Selector
import { useSupportedChains } from 'selectors/chains';
import { useFiatCurrency } from 'selectors';

// Types
import type { AssetCategoryRecordKeys } from 'models/AssetCategory';
import type { TotalBalances } from 'models/TotalBalances';
import type { Chain } from 'models/Chain';

type Props = {
  category: AssetCategoryRecordKeys;
  accountTotalBalances: TotalBalances;
  visibleBalance: boolean;
};

export default function ({ category, accountTotalBalances, visibleBalance }: Props) {
  const [tabIndex, setTabIndex] = React.useState(0);
  const [showMore, setShowMore] = useState(false);
  const { tokens } = useStableAssets();
  const chains = useSupportedChains();
  const navigation = useNavigation();
  const fiatCurrency = useFiatCurrency();

  const chainsConfig = useChainsConfig();

  const { tokens: nonStableTokens, percentage, totalPercentage } = useNonStableAssets();

  const colors = useThemeColors();
  const listOfAssets = tabIndex === 0 ? nonStableTokens : tokens;

  const items = [
    { key: TOKENS, title: TOKENS, component: null, color: colors.primaryAccent250 },
    { key: STABLES, title: STABLES, component: null, color: colors.synthetic180 },
  ];

  const renderItem = (item: any) => {
    return (
      <TokenListItem
        chain={item.chain}
        address={item.address}
        symbol={item.symbol}
        name={item.name}
        iconUrl={item.iconUrl}
        balance={wrapBigNumberOrNil(item.balance?.balance)}
        style={{ paddingLeft: 0, paddingRight: 0 }}
        onPress={() => {
          onNavigate(item, item.chain);
          // const assetData = buildAssetDataNavigationParam(item, item.chain);
          // assetData.backDashboad = true;
          // navigation.navigate(ASSET, { assetData });
        }}
      />
    );
  };

  const onNavigate = (category, chain) => {
    const assetData = buildAssetDataNavigationParam(category, chain);
    assetData.backDashboad = true;
    navigation.navigate(ASSET, { assetData });
  };

  const renderChainWithBalance = (category: AssetCategoryRecordKeys, chain: Chain) => {
    const balance = accountTotalBalances?.[category]?.[chain] ?? new BigNumber(0);
    const formattedBalance = formatFiatValue(balance, fiatCurrency);

    const { title } = chainsConfig[chain];

    return (
      <ChainListItem
        key={`${category}-${chain}`}
        title={title}
        value={formattedBalance}
        visibleBalance={visibleBalance}
        isDeployed={false}
        onPress={() => {
          onNavigate(category, chain);
        }}
        onPressDeploy={() => {}}
      />
    );
  };

  if (totalPercentage === 0) {
    return chains.map((chain) => renderChainWithBalance(category, chain));
  }

  return (
    <>
      <Spacing h={10} />

      <ButtonGroup
        items={items}
        tabIndex={tabIndex}
        onTabIndexChange={(val: number) => {
          setTabIndex(val);
          setShowMore(false);
        }}
      />

      <Spacing h={20} />

      <HorizontalProgressBar progress={percentage} forgroundColor={items[0].color} backgroundColor={items[1].color} />

      <Spacing h={10} />

      <FlatList
        data={listOfAssets.slice(0, showMore ? listOfAssets?.length + 1 : 5)}
        renderItem={({ item }) => renderItem(item)}
        keyExtractor={(item) => item.symbol}
        contentContainerStyle={{ flexGrow: 1 }}
      />

      <Spacing h={10} />

      {listOfAssets?.length > 5 && (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.basic050 }]}
          onPress={() => setShowMore(!showMore)}
        >
          <Icon name={!showMore ? 'down-arrow' : 'up-arrow'} color={colors.text} width={16} height={16} />
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: '100%',
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
});
