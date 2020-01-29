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

// constants
import { RECOVERY_PORTAL_URL_PATHS } from 'constants/recoveryPortalConstants';

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
  initRecoveryPortalWalletRecover: () => void,
};

type State = {
  currentWebViewUrl: ?string,
  checkingNewUrl: boolean,
};

class RecoveryPortalWalletRecover extends React.Component<Props, State> {
  webViewRef: WebView;
  initialUrl: ?string;
  state = {
    currentWebViewUrl: null,
    checkingNewUrl: false,
  };

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
    const { currentWebViewUrl } = this.state;
    if (!this.webViewRef
      || (this.initialUrl && currentWebViewUrl && this.initialUrl.includes(currentWebViewUrl))) {
      this.props.navigation.goBack();
      return;
    }
    this.webViewRef.goBack();
  };

  onNavigationStateChange = (webViewNavigationState) => {
    const { checkingNewUrl, currentWebViewUrl: lastWebViewUrl } = this.state;
    if (checkingNewUrl) return;
    this.setState({ checkingNewUrl: true }, () => {
      const currentWebViewUrl = get(webViewNavigationState, 'url');
      if (!currentWebViewUrl) return;

      // set actual initial url
      if (!this.initialUrl) this.initialUrl = currentWebViewUrl;

      // if it's recovery address then inject current device address to url query param
      const { temporaryWallet } = this.props;
      if (temporaryWallet) {
        const deviceAddressQuery = `?deviceAddress=${temporaryWallet.address}`;
        if (currentWebViewUrl.includes(RECOVERY_PORTAL_URL_PATHS.RECOVER_DEVICE)
          && !currentWebViewUrl.includes(deviceAddressQuery)
          && this.webViewRef) {
          this.webViewRef.stopLoading();
          this.webViewRef.injectJavaScript(`
          window.history.replaceState(null, null, "${RECOVERY_PORTAL_URL_PATHS.RECOVER_DEVICE}${deviceAddressQuery}");
        `);
          this.webViewRef.reload();
        }
      }

      // covers scenario if user logged out (sign-out) on webview and sign in becomes is present home
      if (lastWebViewUrl
        && lastWebViewUrl.includes(RECOVERY_PORTAL_URL_PATHS.SIGN_OUT)
        && currentWebViewUrl.includes(RECOVERY_PORTAL_URL_PATHS.SIGN_IN)) {
        this.initialUrl = currentWebViewUrl;
      }

      this.setState({ currentWebViewUrl, checkingNewUrl: false });
    });
  };

  render() {
    const { temporaryWallet } = this.props;

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Recovery Portal' }],
          customOnBack: this.handleNavigationBack,
        }}
      >
        <Wrapper style={{ flex: 1 }} regularPadding>
          {!temporaryWallet && this.renderLoading()}
          {!!temporaryWallet &&
            <WebView
              ref={(ref) => { this.webViewRef = ref; }}
              source={{ uri: RECOVERY_PORTAL_URL }}
              onNavigationStateChange={this.onNavigationStateChange}
              renderLoading={this.renderLoading}
              originWhitelist={['*']}
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
  recoveryPortal: { temporaryWallet },
}: RootReducerState): $Shape<Props> => ({
  temporaryWallet,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  initRecoveryPortalWalletRecover: () => dispatch(initRecoveryPortalWalletRecoverAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(RecoveryPortalWalletRecover);
