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
import { Keyboard, SectionList } from 'react-native';
import styled from 'styled-components/native';
import t from 'translations/translate';

// Components
import { Spacing } from 'components/layout/Layout';
import TokenListItem from 'components/lists/TokenListItem';
import CollectibleListItem from 'components/lists/CollectibleListItem';
import Modal from 'components/Modal';
import ChainAssetSelectorModal from 'components/Modals/ChainAssetSelectorModal';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';

// Selectors
import { useSupportedChains } from 'selectors/chains';

// Utils
import { mapNotNil } from 'utils/array';
import { getAssetOptionKey, defaultSortAssetOptions } from 'utils/assets';
import { wrapBigNumberOrNil } from 'utils/bigNumber';
import { getCollectibleKey, defaultSortCollectibles } from 'utils/collectibles';

// Types
import type { SectionBase } from 'utils/types/react-native';
import type { AssetOption } from 'models/Asset';
import type { Chain } from 'models/Chain';
import type { Collectible } from 'models/Collectible';

// Local
import ChainSectionHeader from './ChainSectionHeader';
import ChainSectionFooter from './ChainSectionFooter';

type Props = {|
  tokens: AssetOption[],
  onSelectToken: (token: AssetOption) => mixed,
  collectibles?: Collectible[],
  onSelectCollectible?: (collectible: Collectible) => mixed,
|};

const DefaultAssetList = ({ tokens, collectibles, onSelectToken, onSelectCollectible }: Props) => {
  const handleShowMore = (chain: Chain) => {
    Keyboard.dismiss();
    Modal.open(() => (
      <ChainAssetSelectorModal
        chain={chain}
        tokens={tokens}
        onSelectToken={onSelectToken}
        collectibles={collectibles}
        onSelectCollectible={onSelectCollectible}
      />
    ));
  };

  const sections = useSectionData(tokens, collectibles ?? []);

  const renderSectionHeader = ({ chain }: Section) => {
    return <ChainSectionHeader chain={chain} />;
  };

  const renderSectionFooter = ({ chain, showMore }: Section) => {
    return <ChainSectionFooter showMore={showMore} onPress={() => handleShowMore(chain)} />;
  };

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
          onPress={() => onSelectToken(token)}
        />
      );
    }

    if (collectible) {
      return <CollectibleListItem collectible={collectible} onPress={() => onSelectCollectible?.(collectible)} />;
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
    <SectionList
      sections={sections}
      renderSectionHeader={({ section }) => renderSectionHeader(section)}
      renderSectionFooter={({ section }) => renderSectionFooter(section)}
      renderItem={({ item }) => renderItem(item)}
      keyExtractor={getItemKey}
      keyboardShouldPersistTaps="always"
      ListEmptyComponent={renderEmptyState()}
      contentInsetAdjustmentBehavior="scrollableAxes"
      contentContainerStyle={styles.contentContainer}
    />
  );
};

export default DefaultAssetList;

const styles = {
  contentContainer: {
    flexGrow: 1,
  },
};

type Item = {| token?: AssetOption, collectible?: Collectible |};

type Section = {
  ...SectionBase<Item>,
  chain: Chain,
  showMore: boolean,
};

function useSectionData(items: AssetOption[], collectibles: Collectible[]): Section[] {
  const chains = useSupportedChains();
  return mapNotNil(chains, (chain) => buildSection(items, collectibles, chain));
}

const MAX_ITEMS = 5;

function buildSection(tokens: AssetOption[], collectibles: Collectible[], chain: Chain): ?Section {
  const matchingTokens = getMatchingTokens(tokens, chain);
  const matchingCollectibles = getMatchingCollectibles(collectibles, chain);

  if (!matchingTokens.length && !matchingCollectibles.length) return null;

  const tokenItems = matchingTokens.map((token) => ({ token }));
  const collectibleItems = matchingCollectibles.map((collectible) => ({ collectible }));
  const items = [...tokenItems, ...collectibleItems];

  const showMore = items.length > MAX_ITEMS;
  const firstItems = items.slice(0, MAX_ITEMS);
  return { key: chain, chain, data: firstItems, showMore };
}

function getMatchingTokens(tokens: AssetOption[], chain: Chain) {
  const matchingItems = tokens.filter((item) => item.chain === chain);
  return defaultSortAssetOptions(matchingItems);
}

function getMatchingCollectibles(collectibles: Collectible[], chain: Chain) {
  const matchingItems = collectibles.filter((item) => item.chain === chain);
  return defaultSortCollectibles(matchingItems);
}

const EmptyStateWrapper = styled.View`
  flex: 1;
  align-items: center;
`;
