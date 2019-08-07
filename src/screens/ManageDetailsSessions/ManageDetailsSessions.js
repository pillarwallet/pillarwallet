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
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { NavigationActions } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';
import Intercom from 'react-native-intercom';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { WALLETCONNECT_CALL_REQUEST_SCREEN } from 'constants/navigationConstants';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Tabs from 'components/Tabs';
import { killWalletConnectSessionByUrl } from 'actions/walletConnectActions';
import { navigate } from 'services/navigation';

export const SheetContentWrapper = styled.View`
  flex: 1;
`;

type State = {
  activeTab: string,
};

type Props = {
  navigation: NavigationScreenProp<*>,
  user: Object,
  connectors: any[],
  requests: any[],
  killWalletConnectSessionByUrl: (url: string) => void,
};

const ACTIVE = 'ACTIVE';
const REQUESTS = 'REQUESTS';

export const filterSessionsByUrl = (connectors: any[]) => {
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

class MeScreen extends React.Component<Props, State> {
  state = {
    activeTab: ACTIVE,
  };

  getRequestLabel = (payload: any) => {
    let label = 'Transaction Request';

    switch (payload.method) {
      case 'eth_sendTransaction':
      case 'eth_signTransaction':
        label = 'Transaction Request';
        break;
      case 'eth_sign':
      case 'eth_signTypedData':
      case 'eth_signTypedData_v1':
      case 'eth_signTypedData_v3':
      case 'personal_sign':
        label = 'Message Request';
        break;
      default:
        label = 'Call Request';
        break;
    }
    return label;
  };

  onSessionButtonPress = item => {
    const {
      peerMeta: { url },
    } = item;
    if (this.state.activeTab === ACTIVE) {
      this.props.killWalletConnectSessionByUrl(url);
    } else {
      this.onSessionItemPress(item);
    }
  };

  onSessionItemPress = item => {
    const { activeTab } = this.state;
    if (activeTab === REQUESTS) {
      navigate(
        NavigationActions.navigate({
          routeName: WALLETCONNECT_CALL_REQUEST_SCREEN,
          params: item,
        }),
      );
    }
  };

  renderSessionItem = ({ item }) => {
    const { activeTab } = this.state;
    const { peerMeta = {} } = item;
    const { name, icons } = peerMeta;
    const label = activeTab === ACTIVE ? name : this.getRequestLabel(item.payload);
    return (
      <ListItemWithImage
        label={label}
        avatarUrl={icons[0]}
        buttonAction={() => this.onSessionButtonPress(item)}
        buttonActionLabel={activeTab === ACTIVE ? 'Disconnect' : 'Open'}
        onPress={() => this.onSessionItemPress(item)}
      />
    );
  };

  renderSheetContent() {
    const { activeTab } = this.state;
    const { connectors, requests } = this.props;

    let data = [];
    let emptyTitle = '';

    switch (activeTab) {
      case ACTIVE:
        data = filterSessionsByUrl(connectors);
        emptyTitle = 'No Active Sessions';
        break;
      case REQUESTS:
        data = filterSessionsByUrl(requests);
        emptyTitle = 'No Pending Requests';
        break;
      default:
        break;
    }

    return (
      <FlatList
        data={data}
        keyExtractor={({ peerMeta }) => `walletconnect-session-${peerMeta.url}`}
        renderItem={this.renderSessionItem}
        initialNumToRender={8}
        style={{ flex: 1 }}
        contentContainerStyle={
          !data.length
            ? {
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
              }
            : {}
        }
        ListEmptyComponent={<EmptyStateParagraph title={emptyTitle} />}
      />
    );
  }

  setActiveTab = activeTab => this.setState({ activeTab });

  render() {
    const { activeTab } = this.state;
    const sessionTabs = [
      {
        id: ACTIVE,
        name: 'Active',
        onPress: () => this.setActiveTab(ACTIVE),
      },
      {
        id: REQUESTS,
        name: 'Requests',
        onPress: () => this.setActiveTab(REQUESTS),
      },
    ];

    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={{
          centerItems: [{ title: 'Wallet Connect' }],
          rightItems: [{ label: 'Help', onPress: () => Intercom.displayMessenger() }],
        }}
      >
        <Tabs initialActiveTab={activeTab} tabs={sessionTabs} />
        <SheetContentWrapper>{this.renderSheetContent()}</SheetContentWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({ user: { data: user }, walletConnect: { connectors, requests } }) => ({
  user,
  connectors,
  requests,
});

const mapDispatchToProps = dispatch => ({
  killWalletConnectSessionByUrl: url => dispatch(killWalletConnectSessionByUrl(url)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MeScreen);
