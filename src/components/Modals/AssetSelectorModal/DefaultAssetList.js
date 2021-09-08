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
import { Keyboard, SectionList, LayoutAnimation } from 'react-native';
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
import { LIST_ITEMS_APPEARANCE } from 'utils/layoutAnimations';

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

  const { isChainCollapsed, toggleChain } = useCollapseChain();
  const sections = useSectionData(tokens, collectibles ?? [], isChainCollapsed);

  const renderSectionHeader = ({ chain }: Section) => {
    return (
      <ChainSectionHeader chain={chain} onPress={() => toggleChain(chain)} isCollapsed={isChainCollapsed[chain]} />
    );
  };

  const renderSectionFooter = ({ chain, showMore }: Section) => {
    if (isChainCollapsed[chain]) return null;
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

export type FlagPerChain = { [Chain]: ?boolean };

export function useCollapseChain() {
  const [isChainCollapsed, setIsChainCollapsed] = React.useState<FlagPerChain>({});

  const toggleChain = (chain: Chain) => {
    LayoutAnimation.configureNext(LIST_ITEMS_APPEARANCE);
    // $FlowFixMe: type inference limitation
    setIsChainCollapsed({ ...isChainCollapsed, [chain]: !isChainCollapsed[chain] });
  };

  return { isChainCollapsed, toggleChain };
}

function useSectionData(items: AssetOption[], collectibles: Collectible[], isChainCollapsed: FlagPerChain): Section[] {
  const chains = useSupportedChains();
  return mapNotNil(chains, (chain) => buildSection(items, collectibles, chain, isChainCollapsed[chain]));
}

const MAX_ITEMS = 5;

function buildSection(
  tokens: AssetOption[],
  collectibles: Collectible[],
  chain: Chain,
  isCollapsed: ?boolean,
): ?Section {
  const matchingTokens = getMatchingTokens(tokens, chain);
  const matchingCollectibles = getMatchingCollectibles(collectibles, chain);

  if (!matchingTokens.length && !matchingCollectibles.length) return null;

  if (isCollapsed) {
    return { key: chain, chain, data: [], showMore: false };
  }

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
