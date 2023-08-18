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
import { useTranslation } from 'translations/translate';
import { useDispatch } from 'react-redux';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import ChainSelectorContent from 'components/ChainSelector/ChainSelectorContent';
import AddTokenListItem from 'components/lists/AddTokenListItem';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import SearchBar from 'components/SearchBar';
import Spinner from 'components/Spinner';

// Actions
import { addTokensListAction } from 'actions/assetsActions';

// Constants
import { ETHERSPOT_POPULAR_MULTICHAIN } from 'constants/assetsConstants';

// Selectors
import { useRootSelector, addTokensListSelector } from 'selectors';

// Utils
import { getMatchingTokens } from 'utils/wallet';
import { fontSizes } from 'utils/variables';
import { filteredWithChain } from 'utils/etherspot';

export default function () {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const tokenInfo = navigation.getParam('tokenInfo');
  const { addTokensList: tokenList, isFetching } = useRootSelector(addTokensListSelector);

  const fetchedTokenInfo = tokenList.find((token) => token.chain === tokenInfo.chain && token.name === tokenInfo.name);

  React.useEffect(() => {
    dispatch(addTokensListAction(tokenInfo));
  }, []);

  const [selectedChain, setSelectedChain] = React.useState(null);
  const [query, setQuery] = React.useState('');

  const isEtherspotPopularMultichain = tokenInfo.name === ETHERSPOT_POPULAR_MULTICHAIN;

  const tokensAccordingToChain = filteredWithChain(fetchedTokenInfo?.tokens, selectedChain);

  const searchItems = getMatchingTokens(tokensAccordingToChain, query);

  const renderItem = ({ item: token }) => {
    if (!token) return;
    return (
      <AddTokenListItem listType="togglesList" {...token} isEtherspotPopularMultichain={isEtherspotPopularMultichain} />
    );
  };

  function getItemKey(item) {
    const { address, chain } = item;
    return chain + '__' + address;
  }

  const memoizedValue = React.useMemo(() => renderItem, [tokensAccordingToChain, searchItems]);

  const emptyState = () => {
    if (isFetching) return <Spinner size={40} />;
    return <EmptyStateParagraph wide title={t('label.nothingFound')} />;
  };

  const title = isEtherspotPopularMultichain ? t('label.pillarDefaultList') : tokenInfo.name;

  return (
    <Container>
      <HeaderBlock navigation={navigation} centerItems={[{ title: tokenInfo.name }]} noPaddingTop />
      <ChainSelectorContent
        supportedChain={fetchedTokenInfo?.supportedChains}
        selectedAssetChain={selectedChain}
        onSelectChain={setSelectedChain}
      />

      <SearchBar
        inputStyle={{ fontSize: fontSizes.big }}
        style={{ width: '100%' }}
        query={query}
        onQueryChange={setQuery}
        placeholder={t('label.find_token')}
      />

      <FlatList
        key={query ? 'tokens_search_list' : 'tokens_with_toggles'}
        scrollEventThrottle={1}
        maxToRenderPerBatch={30}
        removeClippedSubviews
        data={query ? searchItems : tokensAccordingToChain}
        renderItem={memoizedValue}
        keyExtractor={getItemKey}
        keyboardShouldPersistTaps="always"
        contentInsetAdjustmentBehavior="scrollableAxes"
        ListEmptyComponent={emptyState}
      />
    </Container>
  );
}
