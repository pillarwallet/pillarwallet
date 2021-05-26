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
import { SectionList, useWindowDimensions } from 'react-native';
import styled from 'styled-components/native';
import { chunk } from 'lodash';
import { useTranslation } from 'translations/translate';

// Components
import ChainListHeader from 'components/modern/ChainListHeader';
import ChainListFooter from 'components/modern/ChainListFooter';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';

// Selectors
import { useSupportedChains } from 'selectors/chains';

// Utils
import { mapNotNil } from 'utils/array';
import { spacing } from 'utils/variables';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';
import type { Collectible } from 'models/Collectible';

// Local

import CollectibleListItem from 'screens/Assets/collectibles/CollectibleListItem';

type Props = {|
  items: Collectible[],
  onSelectItem: (collectible: Collectible) => mixed,
  isSearching: boolean,
|};

function CollectibleList({ items, onSelectItem, isSearching }: Props) {
  const { t } = useTranslation();

  const { width } = useWindowDimensions();
  const numberOfColumns = 2;

  const sections = useSectionData(items, numberOfColumns);

  const renderSectionHeader = ({ chain }: Section) => <ChainListHeader chain={chain} />;

  const renderItem = (rowItems: Collectible[]) => {
    const itemWidth = (width - 48) / numberOfColumns;

    return (
      <ListRow>
        {rowItems.map((item) => (
          <CollectibleListItem
            key={item.id}
            title={item.name}
            iconUrl={item.icon}
            width={itemWidth}
            onPress={() => onSelectItem(item)}
          />
        ))}
      </ListRow>
    );
  };

  const renderEmptyState = () => {
    const emptyStateInfo = {
      title: t('collectiblesList.emptyState.noCollectibles.title'),
      bodyText: t('collectiblesList.emptyState.noCollectibles.paragraph'),
    };

    if (isSearching) {
      emptyStateInfo.title = t('collectiblesList.emptyState.noneFound.title');
      emptyStateInfo.bodyText = t('collectiblesList.emptyState.noneFound.paragraph');
    }

    return (
      <EmptyStateWrapper>
        <EmptyStateParagraph {...emptyStateInfo} />
      </EmptyStateWrapper>
    );
  };

  return (
    <SectionList
      sections={sections}
      renderSectionHeader={({ section }) => renderSectionHeader(section)}
      renderSectionFooter={() => <ChainListFooter />}
      renderItem={({ item }) => renderItem(item)}
      keyExtractor={(rowItems) => rowItems[0]?.key}
      ListEmptyComponent={renderEmptyState()}
    />
  );
}

export default CollectibleList;

type Section = {
  ...SectionBase<Collectible[]>,
  chain: Chain,
};

const useSectionData = (items: Collectible[], numberOfColumns: number): Section[] => {
  const chains = useSupportedChains();

  return mapNotNil(chains, (chain) => {
    const chainItems = items.filter((item) => item.chain === chain);
    if (!chainItems.length) return null;

    const data = chunk(chainItems, numberOfColumns);
    return { key: chain, chain, data };
  });
};

const ListRow = styled.View`
  flex-direction: row;
  align-items: stretch;
  padding: 0 ${spacing.mediumLarge}px;
`;

const EmptyStateWrapper = styled.View`
  padding-top: 90px;
  padding-bottom: 90px;
  align-items: center;
`;
