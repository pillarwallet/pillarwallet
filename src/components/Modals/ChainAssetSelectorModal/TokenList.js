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
import { FlatList } from 'react-native';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// Components
import TokenListItem from 'components/lists/TokenListItem';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';

// Utils
import { getAssetOptionKey } from 'utils/assets';
import { wrapBigNumberOrNil } from 'utils/bigNumber';

// Types
import type { AssetOption } from 'models/Asset';

type Props = {|
  items: AssetOption[],
  onSelectItem: (AssetOption) => mixed,
|};

function TokenList({ items, onSelectItem }: Props) {
  const { t } = useTranslation();

  const renderItem = (item: AssetOption) => {
    return (
      <TokenListItem
        chain={item.chain}
        address={item.address}
        symbol={item.symbol}
        name={item.name}
        iconUrl={item.iconUrl}
        balance={wrapBigNumberOrNil(item.balance?.balance)}
        onPress={() => onSelectItem(item)}
      />
    );
  };

  const renderEmptyState = () => {
    return (
      <EmptyStateWrapper>
        <EmptyStateParagraph title={t('label.nothingFound')} />
      </EmptyStateWrapper>
    );
  };

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => renderItem(item)}
      keyExtractor={getAssetOptionKey}
      ListEmptyComponent={renderEmptyState()}
      contentInsetAdjustmentBehavior="scrollableAxes"
      keyboardShouldPersistTaps="always"
    />
  );
}

export default TokenList;

const EmptyStateWrapper = styled.View`
  flex: 1;
  padding-top: 90px;
  padding-bottom: 90px;
  align-items: center;
`;
