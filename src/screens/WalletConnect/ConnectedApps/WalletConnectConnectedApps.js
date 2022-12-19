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
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Modal from 'components/Modal';
import WalletConnectDisconnectModal from 'screens/WalletConnect/DisconnectModal';

// Types
import type { WalletConnectConnector } from 'models/WalletConnect';

// Local
import AppListItem from './AppListItem';
import { type AppItem, useConnectedAppItems } from './selectors';

function WalletConnectConnectedApps() {
  const { t } = useTranslationWithPrefix('walletConnect.connectedApps');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();

  const items = useConnectedAppItems();

  const openDisconnectModal = (connector: WalletConnectConnector) => {
    Modal.open(() => <WalletConnectDisconnectModal connector={connector} />);
  };

  const renderItem = ({ title, iconUrl, chain, connector }: AppItem) => {
    return (
      <AppListItem
        title={title}
        iconUrl={iconUrl}
        chain={chain}
        connector={connector}
        onPress={() => openDisconnectModal(connector)}
      />
    );
  };

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />

      <FlatList
        data={items}
        renderItem={({ item }) => renderItem(item)}
        contentContainerStyle={{ paddingBottom: safeArea.bottom }}
      />
    </Container>
  );
}

export default WalletConnectConnectedApps;
