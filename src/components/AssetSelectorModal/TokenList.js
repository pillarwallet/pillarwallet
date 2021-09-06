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
import { SectionList } from 'react-native';
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';
import t from 'translations/translate';

// Components
import ChainListHeader from 'components/lists/ChainListHeader';
import ChainListFooter from 'components/lists/ChainListFooter';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ListItemWithImage from 'components/legacy/ListItem/ListItemWithImage';

// Selectors
import { useSupportedChains } from 'selectors/chains';

// Utils
import { mapNotNil } from 'utils/array';
import { wrapBigNumberOrNil, sumOrNull } from 'utils/bigNumber';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { AssetOption } from 'models/Asset';
import type { Chain } from 'models/Chain';

type Props = {|
  items: AssetOption[],
  onSelectItem: (AssetOption) => mixed,
|};

function TokenList({ items, onSelectItem }: Props) {
  const sections = useSectionData(items);

  const renderSectionHeader = ({ chain, balance }: Section) => {
    return <ChainListHeader chain={chain} balance={balance} />;
  };

  const renderItem = (item: AssetOption) => {
    if (!item) return null;

    return (
      <ListItemWithImage
        onPress={() => onSelectItem(item)}
        label={item.name}
        itemImageUrl={item.imageUrl}
        balance={item.balance}
        fallbackToGenericToken
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
    <SectionList
      sections={sections}
      renderSectionHeader={({ section }) => renderSectionHeader(section)}
      renderSectionFooter={() => <ChainListFooter />}
      renderItem={({ item }) => renderItem(item)}
      keyExtractor={(option) => `${option.chain}-${option.address}`}
      keyboardShouldPersistTaps="always"
      ListEmptyComponent={renderEmptyState()}
      contentInsetAdjustmentBehavior="scrollableAxes"
    />
  );
}

export default TokenList;

type Section = {
  ...SectionBase<AssetOption>,
  chain: Chain,
  balance: ?BigNumber,
};

const useSectionData = (items: AssetOption[]): Section[] => {
  const chains = useSupportedChains();

  return mapNotNil(chains, (chain) => {
    const data = items.filter((item) => item.chain === chain);
    const balance = sumOrNull(data.map((option) => wrapBigNumberOrNil(option.balance?.balanceInFiat)));
    if (!data.length) return null;

    return { key: chain, chain, balance, data };
  });
};

const EmptyStateWrapper = styled.View`
  padding-top: 90px;
  padding-bottom: 90px;
  align-items: center;
`;
