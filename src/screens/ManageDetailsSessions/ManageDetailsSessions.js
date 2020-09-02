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
import get from 'lodash.get';
import styled from 'styled-components/native';
import { NavigationActions } from 'react-navigation';
import Intercom from 'react-native-intercom';
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { WALLETCONNECT_CALL_REQUEST_SCREEN } from 'constants/navigationConstants';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Tabs from 'components/Tabs';
import { killWalletConnectSessionByUrl } from 'actions/walletConnectActions';
import { navigate } from 'services/navigation';

import type { NavigationScreenProp } from 'react-navigation';
import type { CallRequest } from 'models/WalletConnect';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

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

class ManageDetailsSessions extends React.Component<Props, State> {
  state = {
    activeTab: ACTIVE,
  };

  getRequestLabel = (payload: CallRequest) => {
    let label = t('walletConnectContent.requestType.transaction');

    switch (payload.method) {
      case 'eth_sendTransaction':
      case 'eth_signTransaction':
        label = t('walletConnectContent.requestType.transaction');
        break;
      case 'eth_sign':
      case 'eth_signTypedData':
      case 'eth_signTypedData_v1':
      case 'eth_signTypedData_v3':
      case 'personal_sign':
        label = t('walletConnectContent.requestType.message');
        break;
      default:
        label = t('walletConnectContent.requestType.call');
        break;
    }
    return label;
  };

  onRequestItemPress = (request: CallRequest) => {
    navigate(
      NavigationActions.navigate({
        routeName: WALLETCONNECT_CALL_REQUEST_SCREEN,
        params: { callId: request.callId, goBackDismiss: true },
      }),
    );
  };

  defaultListProps(count: number) {
    const emptyStyle = {
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
    };

    return {
      initialNumToRender: 8,
      style: { flex: 1 },
      contentContainerStyle: count ? {} : emptyStyle,
    };
  }

  renderSessionItem = ({ item }) => {
    const { peerMeta = {} } = item;
    const { name, icons, url } = peerMeta;
    const icon = get(icons, '[0]');

    return (
      <ListItemWithImage
        label={name}
        avatarUrl={icon}
        buttonAction={() => this.props.killWalletConnectSessionByUrl(url)}
        buttonActionLabel={t('button.disconnect')}
      />
    );
  };

  renderRequestItem = ({ item }) => {
    const { icon } = item;

    return (
      <ListItemWithImage
        buttonActionLabel={t('button.open')}
        label={this.getRequestLabel(item)}
        avatarUrl={icon}
        buttonAction={() => this.onRequestItemPress(item)}
        onPress={() => this.onRequestItemPress(item)}
      />
    );
  };

  renderRequestsList() {
    const { requests } = this.props;
    const listProps = this.defaultListProps(requests.length);

    return (
      <FlatList
        {...listProps}
        data={requests}
        keyExtractor={({ url }) => `walletconnect-request-${url}`}
        renderItem={this.renderRequestItem}
        ListEmptyComponent={<EmptyStateParagraph title={t('walletConnectContent.tabs.requests.emptyState.title')} />}
      />
    );
  }

  renderSessionsList() {
    const { connectors } = this.props;
    const filtered = filterSessionsByUrl(connectors);
    const listProps = this.defaultListProps(filtered.length);

    return (
      <FlatList
        {...listProps}
        data={filtered}
        keyExtractor={({ peerMeta }) => `walletconnect-session-${peerMeta.url}`}
        renderItem={this.renderSessionItem}
        ListEmptyComponent={<EmptyStateParagraph title={t('walletConnectContent.tabs.active.emptyState.title')} />}
      />
    );
  }

  setActiveTab = activeTab => this.setState({ activeTab });

  render() {
    const { activeTab } = this.state;
    const sessionTabs = [
      {
        id: ACTIVE,
        name: t('tabs.active.title'),
        onPress: () => this.setActiveTab(ACTIVE),
      },
      {
        id: REQUESTS,
        name: t('tabs.requests.title'),
        onPress: () => this.setActiveTab(REQUESTS),
      },
    ];
    const content = activeTab === ACTIVE
      ? this.renderSessionsList()
      : this.renderRequestsList();

    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={{
          centerItems: [{ title: t('walletConnectContent.title.manageSessionsScreen') }],
          rightItems: [{ link: t('button.support'), onPress: () => Intercom.displayMessenger() }],
          sideFlex: 2,
        }}
      >
        <Tabs tabs={sessionTabs} activeTab={activeTab} />
        <SheetContentWrapper>{content}</SheetContentWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
  walletConnect: { connectors, requests },
}: RootReducerState): $Shape<Props> => ({
  user,
  connectors,
  requests,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  killWalletConnectSessionByUrl: url => dispatch(killWalletConnectSessionByUrl(url)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ManageDetailsSessions);
