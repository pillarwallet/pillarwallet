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

// Actions
import { addTokensListAction } from 'actions/assetsActions';

// Selector
import { useRootSelector, addTokensListSelector } from 'selectors';

function AddTokens() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { addTokensList: tokenList } = useRootSelector(addTokensListSelector);

  const [selectedChain, setSelectedChain] = React.useState(null);

  React.useEffect(() => {
    dispatch(addTokensListAction());
  }, []);

  const renderItem = (token: any) => {
    if (!token) return;
    return <AddTokenListItem {...token} onPress={() => {}} />;
  };

  return (
    <Container>
      <HeaderBlock navigation={navigation} centerItems={[{ title: t('label.add_tokens') }]} noPaddingTop />
      <ChainSelectorContent selectedAssetChain={selectedChain} onSelectChain={setSelectedChain} />
      <FlatList key={'add_tokens_list'} data={tokenList} renderItem={({ item }) => renderItem(item)} />
    </Container>
  );
}

export default AddTokens;
