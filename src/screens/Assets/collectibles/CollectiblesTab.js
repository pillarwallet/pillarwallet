// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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
import { SectionList, useWindowDimensions } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { range, chunk } from 'lodash';

// Components
import FloatingButtons from 'components/FloatingButtons';

// Selectors
import { useSupportedChains } from 'selectors/smartWallet';

// Utils
import { spacing } from 'utils/variables';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

// Local
import { type FlagPerChain, useExpandItemsPerChain } from '../utils';
import ChainListHeader from '../components/ChainListHeader';
import { type CollectibleItem, useCollectibleAssets } from './selectors';
import CollectibleListItem from './CollectibleListItem';

function CollectiblesTab() {
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();

  const { chain: initialChain } = navigation.state.params;
  const { expandItemsPerChain, toggleExpandItems } = useExpandItemsPerChain(initialChain);

  const { width } = useWindowDimensions();
  const numberOfColumns = 2;

  const sections = useSectionData(numberOfColumns, expandItemsPerChain);

  const renderSectionHeader = ({ chain }: Section) => {
    return <ChainListHeader chain={chain} onPress={() => toggleExpandItems(chain)} />;
  };

  const renderItem = (items: CollectibleItem[]) => {
    const itemWidth = (width - 48) / numberOfColumns;

    return (
      <ListRow key={items[0].key}>
        {items.map((item) => (
          <CollectibleListItem key={item.key} title={item.title} iconUrl={item.iconUrl} width={itemWidth} />
        ))}
      </ListRow>
    );
  };

  return (
    <Container>
      <SectionList
        sections={sections}
        renderSectionHeader={({ section }) => renderSectionHeader(section)}
        renderItem={({ item }) => renderItem(item)}
        contentContainerStyle={{ paddingBottom: safeArea.bottom + FloatingButtons.SCROLL_VIEW_BOTTOM_INSET }}
      />
    </Container>
  );
}

export default CollectiblesTab;

type Section = {
  ...SectionBase<CollectibleItem[]>,
  chain: Chain,
};

const useSectionData = (numberOfColumns: number, expandItemsPerChain: FlagPerChain): Section[] => {
  const chains = useSupportedChains();
  const assetsPerChain = useCollectibleAssets();

  return chains.map((chain) => {
    const items = assetsPerChain[chain] ?? [];
    const data: CollectibleItem[][] = expandItemsPerChain[chain] ? chunk(items, numberOfColumns) : [];
    return { key: chain, chain, data };
  });
};

const Container = styled.View`
  flex: 1;
`;

const ListRow = styled.View`
  flex-direction: row;
  align-items: stretch;
  padding: 0 ${spacing.mediumLarge}px;
`;
