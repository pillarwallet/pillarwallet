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
import { Keyboard } from 'react-native';
import { orderBy } from 'lodash';
import t from 'translations/translate';

// Components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import SearchBar from 'components/SearchBar';
import SlideModal from 'components/Modals/SlideModal';
import Tabs from 'components/Tabs';

// Constants
import { TOKENS, COLLECTIBLES } from 'constants/assetsConstants';

// Utils
import { defaultSortAssetOptions } from 'utils/assets';
import { caseInsensitiveIncludes } from 'utils/strings';
import { useThemeColors } from 'utils/themes';

// Types
import type { AssetOption } from 'models/Asset';
import type { Collectible } from 'models/Collectible';

// Local
import TokenList from './TokenList';
import CollectibleList from './CollectibleList';

type Props = {|
  options?: AssetOption[],
  collectibles?: Collectible[],
  onSelectOption?: (asset: AssetOption) => mixed,
  onSelectCollectible?: (collectible: Collectible) => mixed,
  title?: string,
|};

const AssetSelectorModal = ({ options, collectibles, onSelectOption, onSelectCollectible, title }: Props) => {
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

        {activeTabId === TOKENS && <TokenList items={getAssets(options, query)} onSelectItem={selectOption} />}

        {activeTabId === COLLECTIBLES && (
          <CollectibleList
            items={getCollectibles(collectibles, query)}
            onSelectItem={selectCollectible}
            isSearching={!!query}
          />
        )}
      </ContainerWithHeader>
    </SlideModal>
  );
};

export default AssetSelectorModal;

const getAssets = (options: AssetOption[] = [], query: ?string): AssetOption[] => {
  const filteredOptions = options.filter((option) => isMatchingAsset(option, query));
  return defaultSortAssetOptions(filteredOptions);
};

const getCollectibles = (collectibles: Collectible[] = [], query: ?string): Collectible[] => {
  const filteredCollectibles = collectibles.filter((collectible) => isMatchingCollectible(collectible, query));
  return orderBy(filteredCollectibles, [(option: AssetOption) => option.name?.trim().toLowerCase()], ['asc']);
};

const isMatchingAsset = (option: AssetOption, query: ?string) =>
  caseInsensitiveIncludes(option.name, query) || caseInsensitiveIncludes(option.symbol, query);

const isMatchingCollectible = (collectible: Collectible, query: ?string) =>
  caseInsensitiveIncludes(collectible.name, query);
