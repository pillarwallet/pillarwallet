// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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
import { useNavigation } from 'react-navigation-hooks';
import { isEmpty } from 'lodash';
import { useTranslation } from 'translations/translate';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import ChainSelectorContent from 'components/ChainSelector/ChainSelectorContent';
import AddTokenListItem from 'components/lists/AddTokenListItem';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import SearchBar from 'components/SearchBar';

// Utils
import { getMatchingTokens } from 'utils/wallet';
import { fontSizes } from 'utils/variables';
import { filteredWithChain } from 'utils/etherspot';

export default function () {
  const { t } = useTranslation();

  const navigation = useNavigation();

  const { name, tokens } = navigation.getParam('tokenInfo');

  const [selectedChain, setSelectedChain] = React.useState(null);
  const [query, setQuery] = React.useState('');

  const tokensAccordingToChain = filteredWithChain(tokens, selectedChain);

  const searchItems = getMatchingTokens(tokensAccordingToChain, query);

  const renderItem = ({ item: token }) => {
    if (!token) return;
    return <AddTokenListItem listType="togglesList" {...token} onPress={() => {}} />;
  };

  function getItemKey(item) {
    const { address, chain } = item;
    return chain + '__' + address;
  }

  const memoizedValue = React.useMemo(() => renderItem, [tokensAccordingToChain, searchItems]);

  return (
    <Container>
      <HeaderBlock navigation={navigation} centerItems={[{ title: name }]} noPaddingTop />
      <ChainSelectorContent selectedAssetChain={selectedChain} onSelectChain={setSelectedChain} />

      <SearchBar
        accessibilityHint="search_bar"
        inputStyle={{ fontSize: fontSizes.big }}
        style={{ width: '100%' }}
        query={query}
        onQueryChange={setQuery}
        placeholder={t('label.find_token')}
      />

      <FlatList
        key={query ? 'tokens_search_list' : 'tokens_with_toggles'}
        removeClippedSubviews
        data={query ? searchItems : tokensAccordingToChain}
        renderItem={memoizedValue}
        keyExtractor={getItemKey}
        keyboardShouldPersistTaps="always"
        contentInsetAdjustmentBehavior="scrollableAxes"
        ListEmptyComponent={() => <EmptyStateParagraph wide title={t('label.nothingFound')} />}
      />
    </Container>
  );
}
