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
import t from 'translations/translate';

// Components
import { Spacing } from 'components/layout/Layout';
import TokenListItem from 'components/lists/TokenListItem';
import CollectibleListItem from 'components/lists/CollectibleListItem';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';

// Utils
import { getAssetOptionKey, defaultSortAssetOptions, isAssetOptionMatchedByQuery } from 'utils/assets';
import { wrapBigNumberOrNil } from 'utils/bigNumber';
import { useChainsConfig } from 'utils/uiConfig';
import { getCollectibleKey, defaultSortCollectibles, isCollectibleMatchedByQuery } from 'utils/collectibles';

// Selectors
import { useNftFlag } from 'selectors';

// Types
import type { AssetOption } from 'models/Asset';
import type { Collectible } from 'models/Collectible';

type Props = {|
  tokens: AssetOption[],
  onSelectToken: (token: AssetOption) => mixed,
  collectibles?: Collectible[],
  onSelectCollectible?: (collectible: Collectible) => mixed,
  query: string,
|};

const SearchResultAssetList = ({ tokens, collectibles, onSelectToken, onSelectCollectible, query }: Props) => {
  const data = useItemsData(tokens, collectibles ?? [], query);
  const visibleNFTs = useNftFlag();
  const chainConfigs = useChainsConfig();

  const renderItem = (item: Item) => {
    const { token, collectible } = item;

    if (token) {
      return (
        <TokenListItem
          chain={token.chain}
          address={token.address}
          symbol={token.symbol}
          name={token.name}
          iconUrl={token.iconUrl}
          balance={wrapBigNumberOrNil(token.balance?.balance)}
          subtitle={chainConfigs[token.chain]?.title}
          onPress={() => onSelectToken(token)}
        />
      );
    }

    if (collectible && visibleNFTs) {
      return (
        <CollectibleListItem
          collectible={collectible}
          subtitle={chainConfigs[collectible.chain]?.title}
          onPress={() => onSelectCollectible?.(collectible)}
        />
      );
    }

    return null;
  };

  const getItemKey = (item: Item) => {
    const { token, collectible } = item;
    if (token) return getAssetOptionKey(token);
    if (collectible) return getCollectibleKey(collectible);
    return '';
  };

  const renderEmptyState = () => {
    return (
      <EmptyStateWrapper>
        <Spacing flex={1} />
        <EmptyStateParagraph title={t('label.nothingFound')} />
        <Spacing flex={3} />
      </EmptyStateWrapper>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => renderItem(item)}
      keyExtractor={getItemKey}
      keyboardShouldPersistTaps="always"
      ListEmptyComponent={renderEmptyState()}
      contentInsetAdjustmentBehavior="scrollableAxes"
      contentContainerStyle={styles.contentContainer}
    />
  );
};

export default SearchResultAssetList;

const styles = {
  contentContainer: {
    flexGrow: 1,
  },
};

type Item = {| token?: AssetOption, collectible?: Collectible |};

function useItemsData(tokens: AssetOption[], collectibles: Collectible[], query: string): Item[] {
  const tokenItems = getMatchingTokens(tokens, query).map((token) => ({ token }));
  const collectibleItems = getMatchingCollectibles(collectibles, query).map((collectible) => ({ collectible }));
  return [...tokenItems, ...collectibleItems];
}

function getMatchingTokens(tokens: AssetOption[], query: string) {
  const matchingTokens = tokens.filter((item) => isAssetOptionMatchedByQuery(item, query));
  return defaultSortAssetOptions(matchingTokens);
}

function getMatchingCollectibles(collectibles: Collectible[], query: string) {
  const matchingCollectibles = collectibles.filter((collectible) => isCollectibleMatchedByQuery(collectible, query));
  return defaultSortCollectibles(matchingCollectibles);
}

const EmptyStateWrapper = styled.View`
  flex: 1;
  align-items: center;
`;
