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
import { FlatList, Alert } from 'react-native';
import styled from 'styled-components/native';
import t from 'translations/translate';

// hooks
import useWalletConnect from 'hooks/useWalletConnect';

// components
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { MediumText } from 'components/Typography';

// utils
import { spacing } from 'utils/variables';


const Wrapper = styled.View`
  padding-horizontal: ${spacing.layoutSides}px;
`;

const WalletConnectActiveConnections = () => {
  const {
    activeConnectors,
    disconnectSessionByUrl,
  } = useWalletConnect();

  const onItemPress = ({ peerMeta = {} }) => {
    const { name, url } = peerMeta;
    Alert.alert(
      t('alert.walletConnectDisconnect.title', { name }),
      t('alert.walletConnectDisconnect.message', { name }),
      [
        { text: t('alert.walletConnectDisconnect.button.cancel'), style: 'cancel' },
        {
          text: t('alert.walletConnectDisconnect.button.ok'),
          onPress: () => disconnectSessionByUrl(url),
        },
      ],
      { cancelable: true },
    );
  };

  const renderConnector = ({ item }) => {
    const { peerMeta = {} } = item;
    const { name, icons, url } = peerMeta;

    return (
      <ListItemWithImage
        label={name || url}
        avatarUrl={icons?.[0]}
        onPress={() => onItemPress(item)}
      />
    );
  };

  if (!activeConnectors.length) return null;

  return (
    <React.Fragment>
      <Wrapper>
        <MediumText regular accent>{t('walletConnectContent.title.activeConnections')}</MediumText>
      </Wrapper>
      <FlatList
        data={activeConnectors}
        renderItem={renderConnector}
      />
    </React.Fragment>
  );
};

export default WalletConnectActiveConnections;
