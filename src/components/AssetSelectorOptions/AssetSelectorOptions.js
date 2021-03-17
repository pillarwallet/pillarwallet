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

// Utils
import { caseInsensitiveIncludes } from 'utils/strings';
import { useThemeColors } from 'utils/themes';

// Types
import type { AssetOption, AssetTab } from 'models/Selector';


const MIN_QUERY_LENGTH = 2;

type Props = {|
  options?: AssetOption[],
  optionTabs?: AssetTab[],
  onOptionSelect?: (option: AssetOption) => mixed,
  title?: string,
|};

const AssetSelectorOptions = ({
  options,
  optionTabs,
  onOptionSelect,
  title,
}: Props) => {
  const colors = useThemeColors();

  const searchInputRef = React.useRef(null);
  const modalRef = React.useRef(null);

  const [query, setQuery] = React.useState('');
  const [activeTabId, setActiveTabId] = React.useState(optionTabs ? optionTabs[0]?.id : null);

  const activeTab = optionTabs?.find(({ id }) => id === activeTabId);

  const selectValue = (selectedValue: AssetOption) => {
    close();
    onOptionSelect?.(selectedValue);
  };

  const close = () => {
    Keyboard.dismiss();
    modalRef.current?.close();
  };

  const renderItem = (option: AssetOption) => {
    if (!option) return null;

    return (
      <ListItemWithImage
        onPress={() => selectValue(option)}
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
    const isSearching = query && query.length >= MIN_QUERY_LENGTH;

    const resolvedOptions = getOptions(activeTab?.options || options || [], isSearching ? query : null);

    if (activeTab?.displayAsCollectibles) {
      return (
        <CollectiblesList collectibles={resolvedOptions} onCollectiblePress={selectValue} isSearching={isSearching} />
      );
    }

    return (
      <FlatList
        data={resolvedOptions}
        renderItem={({ item }) => renderItem(item)}
        keyExtractor={(option) => option.symbol}
        keyboardShouldPersistTaps="always"
        ListEmptyComponent={renderEmptyState()}
        contentInsetAdjustmentBehavior="scrollableAxes"
      />
    );
  };

  const tabs = optionTabs?.map((tab) => ({ ...tab, onPress: () => setActiveTabId(tab.id) })) ?? [];

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

        {!!optionTabs && <Tabs tabs={tabs} wrapperStyle={{ paddingTop: 22 }} activeTab={activeTabId || tabs[0].name} />}

        {renderList()}
      </ContainerWithHeader>
    </SlideModal>
  );
};

export default AssetSelectorOptions;

export const getOptions = (options: AssetOption[], query: ?string): AssetOption[] => {
  const filteredOptions = options.filter((option) => isMatchingOption(option, query));
  return orderBy(
    filteredOptions,
    [
      (option: AssetOption) => option.balance?.balanceInFiat ?? 0,
      (option: AssetOption) => option.name?.trim().toLowerCase(),
    ],
    ['desc', 'asc'],
  );
};

export const isMatchingOption = (option: AssetOption, query: ?string) => {
  return caseInsensitiveIncludes(option.name, query) || caseInsensitiveIncludes(option.symbol, query);
};

const EmptyStateWrapper = styled.View`
  padding-top: 90px;
  padding-bottom: 90px;
  align-items: center;
`;
