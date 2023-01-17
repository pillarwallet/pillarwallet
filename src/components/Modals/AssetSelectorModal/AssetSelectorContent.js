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
import t from 'translations/translate';
import { FlatList } from 'react-native';

// Components
import SearchBar from 'components/SearchBar';
import Icon from 'components/core/Icon';

// Selector
import { useSupportedChains } from 'selectors/chains';

// Utils
import { useChainsConfig } from 'utils/uiConfig';

// Types
import type { AssetOption } from 'models/Asset';
import type { Collectible } from 'models/Collectible';
import type { Chain } from 'models/Chain';

// Local
import DefaultAssetList from './DefaultAssetList';
import SearchResultAssetList from './SearchResultAssetList';

type Props = {|
  tokens: AssetOption[],
  onSelectToken: (token: AssetOption) => mixed,
  collectibles?: Collectible[],
  onSelectCollectible?: (collectible: Collectible) => mixed,
  autoFocus?: boolean,
  selectedAssetChain: ?Chain,
  onSelectAssetChain: (val: ?Chain) => void,
  searchTokenList?: any,
|};

const AssetSelectorContent = ({
  tokens,
  collectibles,
  onSelectToken,
  onSelectCollectible,
  autoFocus = false,
  selectedAssetChain,
  onSelectAssetChain,
  searchTokenList,
}: Props) => {
  const [query, setQuery] = React.useState('');

  const tokenFiltered = selectedAssetChain ? tokens?.filter((res) => res.chain === selectedAssetChain) : tokens;
  const searchSelectedChain = selectedAssetChain
    ? searchTokenList?.filter((res) => res.chain === selectedAssetChain)
    : searchTokenList;

  const searchFiltered = searchSelectedChain ?? tokenFiltered;

  const collectibleFiltered = selectedAssetChain
    ? collectibles?.filter((res) => res.chain === selectedAssetChain)
    : collectibles;

  const chains = useSupportedChains();

  const showSearchResults = query.length >= 2;

  const chainConfig = useChainsConfig();

  const renderItem = (chain: Chain) => {
    const asset = chainConfig[chain];

    return (
      <Button onPress={() => onPressChain(chain)} isSelected={selectedAssetChain === chain}>
        <ChainIcon name={asset.iconName} width={40} height={40} />
      </Button>
    );
  };

  const onPressChain = (chain: Chain) => {
    if (selectedAssetChain === chain) {
      onSelectAssetChain(null);
    } else {
      onSelectAssetChain(chain);
    }
  };

  return (
    <Container>
      <ListContainer>
        <FlatList
          horizontal
          bounces={false}
          data={chains}
          renderItem={({ item }) => renderItem(item)}
          style={{ marginHorizontal: 20, marginVertical: 10, maxHeight: 70, alignSelf: 'center' }}
          keyboardShouldPersistTaps="always"
          showsHorizontalScrollIndicator={false}
        />
      </ListContainer>

      <SearchBar autoFocus={autoFocus} query={query} onQueryChange={setQuery} placeholder={t('label.search')} />

      {!showSearchResults && (
        <DefaultAssetList
          tokens={tokenFiltered}
          onSelectToken={onSelectToken}
          collectibles={collectibleFiltered}
          onSelectCollectible={onSelectCollectible}
        />
      )}

      {showSearchResults && (
        <SearchResultAssetList
          tokens={searchFiltered}
          onSelectToken={onSelectToken}
          collectibles={collectibleFiltered}
          onSelectCollectible={onSelectCollectible}
          query={query}
        />
      )}
    </Container>
  );
};

export default AssetSelectorContent;

const Container = styled.View`
  flex: 1;
`;

const Button = styled.TouchableOpacity`
  height: 55px;
  width: 55px;
  margin-right: 10px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background-color: ${({ theme, isSelected }) => (isSelected ? theme.colors.basic040 : theme.colors.basic050)};
`;

const ChainIcon = styled(Icon)``;

const ListContainer = styled.View`
  height: 90px;
`;
