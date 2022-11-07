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
import { FlatList, TouchableOpacity } from 'react-native';

// Components
import ButtonGroup from 'components/layout/ButtonGroup';
import { Spacing } from 'components/legacy/Layout';
import TokenListItem from 'components/lists/TokenListItem';
import Text from 'components/core/Text';

// Constants
import { TOKENS, STABLES } from 'constants/walletConstants';

// Utils
// import { useStableAssets } from 'utils/assets';
import { useThemeColors } from 'utils/themes';
import { useFromAssets } from 'screens/Bridge/Exchange-CrossChain/utils';
import { wrapBigNumberOrNil } from 'utils/bigNumber';

// Types
import HorizontalProgressBar from 'components/Progress/HorizontalProgressBar';

type Props = {};

export default function ({}: Props) {
  const [tabIndex, setTabIndex] = React.useState(0);
  const [showMore, setShowMore] = useState(false);
  // const data = useStableAssets();

  const colors = useThemeColors();
  const listOfBalanceAssets = useFromAssets();

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
        onPress={async () => {
          // await onSelectToken(item);
        }}
      />
    );
  };

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
      <HorizontalProgressBar progress={60} forgroundColor={items[0].color} backgroundColor={items[1].color} />
      <Spacing h={10} />
      <FlatList
        data={listOfBalanceAssets.slice(0, showMore ? listOfBalanceAssets?.length + 1 : 5)}
        renderItem={({ item }) => renderItem(item)}
        keyExtractor={(item) => item.symbol}
        contentContainerStyle={{ flexGrow: 1 }}
      />
      <Spacing h={10} />
      {listOfBalanceAssets?.length > 5 && (
        <TouchableOpacity
          style={{
            width: '100%',
            height: 40,
            alignItems: 'center',
            borderRadius: 10,
            backgroundColor: colors.basic050,
          }}
          onPress={() => setShowMore(!showMore)}
        >
          <Text style={{ fontSize: 20 }}>⌄</Text>
        </TouchableOpacity>
      )}
    </>
  );
}
