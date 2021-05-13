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
import { FlatList } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import { Container } from 'components/modern/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/modern/Text';

// Local
import { type ConnectedAppItem, useConnectedAppItems } from './selectors';


function WalletConnectConnectedApps() {
  const { t } = useTranslationWithPrefix('walletConnect.connectedApps');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();

  const items = useConnectedAppItems();

  const renderItem = (item: ConnectedAppItem) => {
    return <Text>{item.title}</Text>;
  };

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />

      <FlatList
        data={items}
        renderItem={({ item }) => renderItem(item)}
        keyExtractor={(item) => item.title}
        contentContainerStyle={{ paddingBottom: safeArea.bottom }}
      />
    </Container>
  );
}

export default WalletConnectConnectedApps;

