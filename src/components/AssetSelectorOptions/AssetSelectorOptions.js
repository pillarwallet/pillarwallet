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
import styled from 'styled-components/native';
import { Keyboard, FlatList } from 'react-native';
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
import { getMatchingSortedData } from 'utils/textInput';
import { useThemeColors } from 'utils/themes';

// Types
import type { AssetOption, AssetTab } from 'models/Selector';
import type { IconProps } from 'components/SearchBar';


const MIN_QUERY_LENGTH = 2;

type Props = {|
  options?: AssetOption[],
  optionTabs?: AssetTab[],
  onOptionSelect?: (option: AssetOption) => mixed,
  title?: string,
  searchPlaceholder?: string,
  noImageFallback?: boolean,
  iconProps?: IconProps,
  onHide?: () => void,
  onOpen?: () => void,
|};

const AssetSelectorOptions = ({
  options,
  optionTabs,
  onOptionSelect,
  title,
  searchPlaceholder,
  iconProps,
  noImageFallback,
  onOpen,
  onHide,
}: Props) => {
  const colors = useThemeColors();

  const searchInputRef = React.useRef(null);
  const modalRef = React.useRef(null);

  const [query, setQuery] = React.useState('');
  const [activeTab, setActiveTab] = React.useState(optionTabs ? optionTabs[0]?.id : null);

  const focusInput = () => {
    searchInputRef.current?.focus();
  };

  const handleOptionsOpen = () => {
    focusInput();
    onOpen?.();
  };

  const handleSearch = (query: string) => {
    setQuery(!query ? '' : query.trim());
  };

  const selectValue = (selectedValue: AssetOption) => {
    close();
    onOptionSelect?.(selectedValue);
  };

  const close = () => {
    Keyboard.dismiss();
    modalRef.current?.close();
  };

  const renderOption = ({ item: option }: Object) => {
    if (!option) return null;

    const {
      name, imageUrl, imageSource, opacity, disabled,
    } = option;

    return (
      <ListItemWithImage
        onPress={!disabled ? () => selectValue(option) : null}
        label={name}
        itemImageUrl={imageUrl}
        iconSource={imageSource}
        fallbackToGenericToken={!noImageFallback}
        wrapperOpacity={opacity}
        {...option}
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

  const isSearching = query && query.length >= MIN_QUERY_LENGTH;

  const updatedOptionTabs =
    !!optionTabs && optionTabs.length
      ? optionTabs.map(({ id, ...rest }) => ({ ...rest, onPress: () => setActiveTab(id), id }))
      : [];

  const activeTabInfo = optionTabs && optionTabs.find(({ id }) => id === activeTab);
  const activeTabOptions = activeTabInfo?.options;
  const relatedOptions = activeTabOptions || options || [];
  const collectibles = activeTabInfo?.collectibles;

  const filteredOptions = isSearching ? getMatchingSortedData(relatedOptions, query) : relatedOptions;

  return (
    <SlideModal
      ref={modalRef}
      fullScreen
      onModalShow={handleOptionsOpen}
      onModalHide={onHide}
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
      >
        <SearchBar
          query={query}
          onChangeQuery={handleSearch}
          placeholder={searchPlaceholder}
          inputRef={searchInputRef}
          // $FlowFixMe
          iconProps={{ ...iconProps, persistIconOnFocus: true }}
        />

        {!!optionTabs && (
          <Tabs
            tabs={updatedOptionTabs}
            wrapperStyle={{ paddingTop: 22 }}
            activeTab={activeTab || updatedOptionTabs[0].name}
          />
        )}
        {collectibles ? (
          <CollectiblesList
            collectibles={filteredOptions}
            onCollectiblePress={selectValue}
            isSearching={isSearching}
          />
        ) : (
          <FlatList
            data={filteredOptions}
            renderItem={renderOption}
            keyExtractor={(option) => option.symbol}
            keyboardShouldPersistTaps="always"
            ListEmptyComponent={renderEmptyState()}
          />
        )}
      </ContainerWithHeader>
    </SlideModal>
  );
};

export default AssetSelectorOptions;

const EmptyStateWrapper = styled.View`
  padding-top: 90px;
  padding-bottom: 90px;
  align-items: center;
`;
