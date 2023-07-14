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

import React from 'react';
import { FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';

// Hooks
import { useStableAssets, useNonStableAssets } from 'hooks/assets';

// Components
import ButtonGroup from 'components/layout/ButtonGroup';
import { Spacing } from 'components/legacy/Layout';
import TokenListItem from 'components/lists/TokenListItem';
import Icon from 'components/core/Icon';
import HorizontalProgressBar from 'components/Progress/HorizontalProgressBar';
import { TokenLoader } from 'components/SkeletonLoader/OnboardingLoaders';

// Constants
import { TOKENS, STABLES } from 'constants/walletConstants';
import { ASSET, ASSETS } from 'constants/navigationConstants';

// Utils
import { useThemeColors } from 'utils/themes';
import { wrapBigNumberOrNil } from 'utils/bigNumber';
import { buildAssetDataNavigationParam } from 'screens/Assets/utils';

// Selectors
import { useOnboardingFetchingSelector } from 'selectors';

// Types
import type { AssetOption } from 'models/Asset';

export default function () {
  const { tokens } = useStableAssets();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { tokens: nonStableTokens, percentage } = useNonStableAssets();
  const isFetching = useOnboardingFetchingSelector();

  const items = [
    { key: TOKENS, title: TOKENS, color: colors.darkViolet },
    { key: STABLES, title: STABLES, color: colors.dodgerBlue },
  ];

  const [selectedTabNm, setSelectedTabNm] = React.useState(items[0].title);

  let listOfAssets = selectedTabNm === TOKENS ? nonStableTokens : tokens;

  const renderItem = (item: AssetOption, index: number) => {
    if (isFetching) {
      return <TokenLoader />;
    }
    return (
      <TokenListItem
        key={item.address + '__' + index}
        chain={item.chain}
        address={item.address}
        symbol={item.symbol}
        name={item.name}
        iconUrl={item.iconUrl}
        balance={wrapBigNumberOrNil(item.balance?.balance)}
        style={{ paddingLeft: 0, paddingRight: 0 }}
        onPress={() => {
          onNavigate(item, item.chain);
        }}
      />
    );
  };

  const onNavigate = (category, chain) => {
    const assetData = buildAssetDataNavigationParam(category, chain);
    assetData.backDashboad = true;
    navigation.navigate(ASSET, { assetData, isNavigateToHome: true });
  };

  return (
    <>
      <Spacing h={10} />

      <ButtonGroup items={items} tabName={selectedTabNm} onSelectedTabName={setSelectedTabNm} />

      <Spacing h={20} />

      <HorizontalProgressBar
        selectedName={selectedTabNm}
        progress={percentage}
        forgroundColor={items[0].color}
        backgroundColor={items[1].color}
      />

      <Spacing h={10} />

      <FlatList
        key={selectedTabNm + '__'}
        data={listOfAssets.slice(0, 5)}
        renderItem={({ item, index }) => renderItem(item, index)}
        keyExtractor={(item) => item.address + '__' + item.chain}
        contentContainerStyle={{ flexGrow: 1 }}
      />

      <Spacing h={10} />

      {listOfAssets?.length > 5 && (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.basic050 }]}
          onPress={() => {
            navigation.navigate(ASSETS);
          }}
        >
          <Icon name={'down-arrow'} color={colors.text} width={16} height={16} />
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
