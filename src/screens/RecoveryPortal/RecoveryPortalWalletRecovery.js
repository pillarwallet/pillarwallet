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
import { BackHandler, Platform } from 'react-native';
import { connect } from 'react-redux';
import { WebView } from 'react-native-webview';
import get from 'lodash.get';
import { RECOVERY_PORTAL_URL } from 'react-native-dotenv';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { initRecoveryPortalWalletRecoverAction } from 'actions/recoveryPortalActions';

// components
import { Wrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Spinner from 'components/Spinner';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { EthereumWallet } from 'models/Wallet';


type Props = {
  navigation: NavigationScreenProp,
  temporaryWallet: ?EthereumWallet,
  isRecoveryPending: boolean,
  initRecoveryPortalWalletRecover: () => void,
};

class RecoveryPortalWalletRecovery extends React.Component<Props> {
  webViewRef: WebView;
  canWebviewNavigateBack: boolean = false;

  componentDidMount() {
    this.props.initRecoveryPortalWalletRecover();
    if (Platform.OS !== 'android') return;
    BackHandler.addEventListener('hardwareBackPress', this.handleNavigationBack);
  }

  componentWillUnmount() {
    if (Platform.OS !== 'android') return;
    BackHandler.removeEventListener('hardwareBackPress', this.handleNavigationBack);
  }

  renderLoading = () => <Spinner style={{ alignSelf: 'center', position: 'absolute', top: '50%' }} />;

  handleNavigationBack = () => {
    if (!this.webViewRef || !this.canWebviewNavigateBack) {
      this.props.navigation.goBack();
      return;
    }
    this.webViewRef.goBack();
  };

  onNavigationStateChange = (webViewNavigationState) => {
    this.canWebviewNavigateBack = !!webViewNavigationState.canGoBack;
  };

  onWebViewMessage = (message) => {
    const messageType = get(message, 'nativeEvent.data');
    const { temporaryWallet } = this.props;
    if (!this.webViewRef || messageType !== 'getRecoveryDeviceAddress' || !temporaryWallet) return;
    this.webViewRef.injectJavaScript(`
      var event = new CustomEvent("recoveryDeviceAddressAdded", {
        detail: { address: "${temporaryWallet.address}" }
      });
      document.dispatchEvent(event);
    `);
  };

  render() {
    const { temporaryWallet, isRecoveryPending } = this.props;

    const showWebView = !!temporaryWallet || isRecoveryPending;

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Recovery Portal' }],
          customOnBack: this.handleNavigationBack,
        }}
      >
        <Wrapper style={{ flex: 1 }}>
          {!showWebView && this.renderLoading()}
          {showWebView &&
            <WebView
              ref={(ref) => { this.webViewRef = ref; }}
              source={{ uri: RECOVERY_PORTAL_URL }}
              onNavigationStateChange={this.onNavigationStateChange}
              onMessage={this.onWebViewMessage}
              renderLoading={this.renderLoading}
              originWhitelist={['*']}
              cacheEnabled={false}
              sharedCookiesEnabled={false}
              thirdPartyCookiesEnabled={false}
              hideKeyboardAccessoryView
              startInLoadingState
              incognito
            />
          }
        </Wrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  wallet: { backupStatus: { isRecoveryPending } },
  recoveryPortal: { temporaryWallet },
}: RootReducerState): $Shape<Props> => ({
  temporaryWallet,
  isRecoveryPending,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  initRecoveryPortalWalletRecover: () => dispatch(initRecoveryPortalWalletRecoverAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(RecoveryPortalWalletRecovery);
