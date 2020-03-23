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
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import get from 'lodash.get';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { MediumText } from 'components/Typography';
import { killWalletConnectSessionByUrl } from 'actions/walletConnectActions';
import { spacing } from 'utils/variables';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { Connector } from 'models/WalletConnect';


type Props = {
  connectors: Connector[],
  killWalletConnectSessionByUrl: (url: string) => void,
};

const Margin = styled.View`
  margin-horizontal: ${spacing.layoutSides}px;
`;

const filterSessionsByUrl = (connectors: any[]) => {
  const urls = [];
  const sessions = [];
  connectors.forEach(({ session }) => {
    if (session.peerMeta) {
      if (!urls.includes(session.peerMeta.url)) {
        urls.push(session.peerMeta.url);
        sessions.push(session);
      }
    }
  });
  return sessions;
};

class ActiveConnections extends React.Component<Props> {
  onItemPress = (item) => {
    const { peerMeta = {} } = item;
    const { name, url } = peerMeta;
    Alert.alert(
      `Disconnect from ${name}`,
      `Please confirm disconnect from ${name}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', onPress: () => this.props.killWalletConnectSessionByUrl(url) },
      ],
      { cancelable: true },
    );
  }

  renderConnection = ({ item }) => {
    const { peerMeta = {} } = item;
    const { name, icons } = peerMeta;
    const icon = get(icons, '[0]');

    return (
      <ListItemWithImage
        label={name}
        avatarUrl={icon}
        onPress={() => this.onItemPress(item)}
      />
    );
  };

  render() {
    const { connectors } = this.props;
    const filtered = filterSessionsByUrl(connectors);
    if (!filtered.length) return null;
    return (
      <React.Fragment>
        <Margin>
          <MediumText regular accent>Active сonnections</MediumText>
        </Margin>
        <FlatList
          data={filtered}
          renderItem={this.renderConnection}
        />
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({
  walletConnect: { connectors },
}: RootReducerState): $Shape<Props> => ({
  connectors,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  killWalletConnectSessionByUrl: url => dispatch(killWalletConnectSessionByUrl(url)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ActiveConnections);
