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
import { FlatList, useWindowDimensions } from 'react-native';
import styled from 'styled-components/native';
import { chunk } from 'lodash';

// Utils
import { getCollectibleKey } from 'utils/collectibles';
import { spacing } from 'utils/variables';

// Types
import type { Collectible } from 'models/Collectible';

// Local

import CollectibleListItem from 'screens/Assets/collectibles/CollectibleListItem';

type Props = {|
  items: Collectible[],
  onSelectItem: (collectible: Collectible) => mixed,
|};

function CollectibleList({ items, onSelectItem }: Props) {
  const { width } = useWindowDimensions();
  const numberOfColumns = 2;

  const rowData = chunk(items, numberOfColumns);

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

  return (
    <FlatList
      data={rowData}
      renderItem={({ item }) => renderItem(item)}
      keyExtractor={(rowItems) => getCollectibleKey(rowItems[0])}
      contentContainerStyle={styles.contentContainer}
    />
  );
}

export default CollectibleList;

const styles = {
  contentContainer: {
    flexGrow: 1,
  },
};

const ListRow = styled.View`
  flex-direction: row;
  align-items: stretch;
  padding: 0 ${spacing.mediumLarge}px;
`;

