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
import { Container } from 'components/Layout';
import { WALLETCONNECT_SESSION_REQUEST_SCREEN } from 'constants/navigationConstants';
import { baseColors } from 'utils/variables';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Header from 'components/Header';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Tabs from 'components/Tabs';
import {
  killWalletConnectSessionByUrl,
  clearPendingWalletConnectSessionByUrl,
  onWalletConnectSessionRejection,
} from 'actions/walletConnectActions';
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
  pending: any[],
  clearPendingWalletConnectSessionByUrl: (url: string) => void,
  killWalletConnectSessionByUrl: (url: string) => void,
  onWalletConnectSessionRejection: Function,
};

const ACTIVE = 'ACTIVE';
const REQUESTS = 'REQUESTS';

class MeScreen extends React.Component<Props, State> {
  state = {
    activeTab: ACTIVE,
  };

  filterSessionsByUrl = (connectors: any[]) => {
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

  disconnect = (item) => {
    const {
      peerMeta: { url },
      peerId,
    } = item;
    if (this.state.activeTab === ACTIVE) {
      this.props.killWalletConnectSessionByUrl(url);
    } else {
      this.props.onWalletConnectSessionRejection(peerId);
      this.props.clearPendingWalletConnectSessionByUrl(url);
    }
  };

  onSessionItemPress = (item) => {
    const { activeTab } = this.state;
    const { peerMeta, peerId } = item;
    if (activeTab === REQUESTS) {
      navigate(
        NavigationActions.navigate({
          routeName: WALLETCONNECT_SESSION_REQUEST_SCREEN,
          params: {
            peerId,
            peerMeta,
          },
        }),
      );
    }
  };

  renderSessionItem = ({ item }) => {
    const { activeTab } = this.state;
    const { peerMeta = {} } = item;
    const { name, icons } = peerMeta;
    return (
      <ListItemWithImage
        label={name}
        avatarUrl={icons[0]}
        buttonAction={() => this.disconnect(item)}
        buttonActionLabel={activeTab === ACTIVE ? 'Disconnect' : 'Cancel'}
        onPress={() => this.onSessionItemPress(item)}
      />
    );
  };

  renderSheetContent() {
    const { activeTab } = this.state;
    const { connectors, pending } = this.props;

    let data = [];
    let emptyTitle = '';

    switch (activeTab) {
      case ACTIVE:
        data = this.filterSessionsByUrl(connectors);
        emptyTitle = 'No Active Sessions';
        break;
      case REQUESTS:
        data = this.filterSessionsByUrl(pending);
        emptyTitle = 'No Pending Requests';
        break;
      default:
        break;
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item) => `walletconnect-session-${item.url}`}
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
        ListEmptyComponent={
          <EmptyStateParagraph
            title={emptyTitle}
          />
        }

      />
    );
  }

  setActiveTab = activeTab => this.setState({ activeTab });

  render() {
    const { navigation } = this.props;
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
      <Container
        inset={{ bottom: 0 }}
        color={baseColors.white}
      >
        <Header
          onBack={() => navigation.goBack()}
          title="sessions"
          nextText="Get help"
          onNextPress={() => Intercom.displayMessenger()}
          headerRightFlex={2}
        />
        <Tabs initialActiveTab={activeTab} tabs={sessionTabs} />
        <SheetContentWrapper>{this.renderSheetContent()}</SheetContentWrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
  walletConnect: { connectors, pending },
}) => ({
  user,
  connectors,
  pending,
});

const mapDispatchToProps = dispatch => ({
  clearPendingWalletConnectSessionByUrl: url => dispatch(clearPendingWalletConnectSessionByUrl(url)),
  killWalletConnectSessionByUrl: url => dispatch(killWalletConnectSessionByUrl(url)),
  onWalletConnectSessionRejection: peerId => dispatch(onWalletConnectSessionRejection(peerId)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MeScreen);
