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

// Components
import SearchBar from 'components/SearchBar';

// Types
import type { AssetOption } from 'models/Asset';
import type { Collectible } from 'models/Collectible';

// Local
import DefaultAssetList from './DefaultAssetList';
import SearchResultAssetList from './SearchResultAssetList';

type Props = {|
  tokens: AssetOption[],
  onSelectToken: (token: AssetOption) => mixed,
  collectibles?: Collectible[],
  onSelectCollectible?: (collectible: Collectible) => mixed,
|};

const AssetSelectorContent = ({ tokens, collectibles, onSelectToken, onSelectCollectible }: Props) => {
  const [query, setQuery] = React.useState('');

  const showSearchResults = query.length >= 2;

  return (
    <Container>
      <SearchBar query={query} onQueryChange={setQuery} placeholder={t('label.filterByName')} />

      {!showSearchResults && (
        <DefaultAssetList
          tokens={tokens}
          onSelectToken={onSelectToken}
          collectibles={collectibles}
          onSelectCollectible={onSelectCollectible}
        />
      )}

      {showSearchResults && (
        <SearchResultAssetList
          tokens={tokens}
          onSelectToken={onSelectToken}
          collectibles={collectibles}
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
