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
import { Keyboard, FlatList } from 'react-native';
import styled from 'styled-components/native';
import { orderBy } from 'lodash';
import t from 'translations/translate';

// Components
import CollectiblesList from 'components/CollectiblesList';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import SearchBar from 'components/SearchBar';
import SlideModal from 'components/Modals/SlideModal';
import Tabs from 'components/Tabs';

// Constants
import { TOKENS, COLLECTIBLES, ETH, PLR } from 'constants/assetsConstants';

// Utils
import { caseInsensitiveIncludes } from 'utils/strings';
import { useThemeColors } from 'utils/themes';

// Types
import type { AssetOption } from 'models/Asset';
import type { Collectible } from 'models/Collectible';

type Props = {|
  options?: AssetOption[],
  collectibles?: Collectible[],
  onSelectOption?: (asset: AssetOption) => mixed,
  onSelectCollectible?: (collectible: Collectible) => mixed,
  title?: string,
|};

const AssetSelectorOptions = ({
  options,
  collectibles,
  onSelectOption,
  onSelectCollectible,
  title,
}: Props) => {
  const searchInputRef = React.useRef(null);
  const modalRef = React.useRef(null);

  const [query, setQuery] = React.useState('');
  const [activeTabId, setActiveTabId] = React.useState(TOKENS);

  const tabs = collectibles
    ? [
      {
        id: TOKENS,
        name: t('label.tokens'),
        onPress: () => setActiveTabId(TOKENS),
      },
      {
        id: COLLECTIBLES,
        name: t('label.collectibles'),
        onPress: () => setActiveTabId(COLLECTIBLES),
      },
    ]
    : null;

  const selectOption = (option: AssetOption) => {
    close();
    onSelectOption?.(option);
  };

  const selectCollectible = (collectible: Collectible) => {
    close();
    onSelectCollectible?.(collectible);
  };

  const close = () => {
    Keyboard.dismiss();
    modalRef.current?.close();
  };

  const colors = useThemeColors();

  const renderOption = (option: AssetOption) => {
    if (!option) return null;

    return (
      <ListItemWithImage
        onPress={() => selectOption(option)}
        label={option.name}
        itemImageUrl={option.imageUrl}
        balance={option.balance}
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

  const renderList = () => {
    if (activeTabId === COLLECTIBLES) {
      return (
        <CollectiblesList
          collectibles={getCollectibles(collectibles, query)}
          onCollectiblePress={selectCollectible}
          isSearching={!!query}
        />
      );
    }

    return (
      <FlatList
        data={getAssets(options, query)}
        renderItem={({ item }) => renderOption(item)}
        keyExtractor={(option) => option.symbol}
        keyboardShouldPersistTaps="always"
        ListEmptyComponent={renderEmptyState()}
        contentInsetAdjustmentBehavior="scrollableAxes"
      />
    );
  };

  return (
    <SlideModal
      ref={modalRef}
      fullScreen
      onModalShow={() => searchInputRef.current?.focus()}
      noSwipeToDismiss
      noClose
      backgroundColor={colors.basic050}
      noTopPadding
    >
      <ContainerWithHeader
        headerProps={{
          noPaddingTop: true,
          customOnBack: close,
          centerItems: [{ title }],
        }}
        inset={{ bottom: 'never' }}
      >
        <SearchBar
          query={query}
          onChangeQuery={(text) => setQuery(text?.trim() ?? '')}
          inputRef={searchInputRef}
          iconProps={{ persistIconOnFocus: true }}
        />

        {!!tabs && <Tabs tabs={tabs} activeTab={activeTabId} wrapperStyle={{ paddingTop: 22 }} />}

        {renderList()}
      </ContainerWithHeader>
    </SlideModal>
  );
};

export default AssetSelectorOptions;

const getAssets = (options: AssetOption[] = [], query: ?string): AssetOption[] => {
  const filteredOptions = options.filter((option) => isMatchingAsset(option, query));
  return orderBy(
    filteredOptions,
    [
      (option: AssetOption) => getOptionSortPriority(option),
      (option: AssetOption) => option.balance?.balanceInFiat ?? 0,
      (option: AssetOption) => option.name?.trim().toLowerCase(),
    ],
    ['desc', 'desc', 'asc'],
  );
};

const getCollectibles = (collectibles: Collectible[] = [], query: ?string): Collectible[] => {
  const filteredCollectibles = collectibles.filter((collectible) => isMatchingCollectible(collectible, query));
  return orderBy(filteredCollectibles, [(option: AssetOption) => option.name?.trim().toLowerCase()], ['asc']);
};

const isMatchingAsset = (option: AssetOption, query: ?string) =>
  caseInsensitiveIncludes(option.name, query) || caseInsensitiveIncludes(option.symbol, query);

const isMatchingCollectible = (collectible: Collectible, query: ?string) =>
  caseInsensitiveIncludes(collectible.name, query);

const getOptionSortPriority = (option: AssetOption) => {
  if (option.symbol === ETH || option.symbol === PLR) return 3;
  if (option.balance?.balance) return 2;
  if (option.imageUrl) return 1;
  return 0;
};

const EmptyStateWrapper = styled.View`
  padding-top: 90px;
  padding-bottom: 90px;
  align-items: center;
`;
