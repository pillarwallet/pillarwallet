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
import isEmpty from 'lodash.isempty';
import { RECOVERY_PORTAL_URL } from 'react-native-dotenv';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { executeDeepLinkAction } from 'actions/deepLinkActions';

// constants
import { RECOVERY_PORTAL_URL_PATHS } from 'constants/recoveryPortalConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';

// components
import { Wrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Spinner from 'components/Spinner';

// util
import { validateDeepLink } from 'utils/deepLink';
import { getSmartWalletStatus } from 'utils/smartWallet';

// types
import type { Accounts } from 'models/Account';
import type { ConnectedSmartWalletAccount } from 'models/SmartWalletAccount';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';


type Props = {
  navigation: NavigationScreenProp,
  connectedSmartWallet: ConnectedSmartWalletAccount,
  executeDeepLink: (deepLink: string) => void,
  accounts: Accounts,
  smartWalletState: Object,
};

type State = {
  checkingNewUrl: boolean,
};

class RecoveryPortalSetupSignUp extends React.Component<Props, State> {
  webViewRef: WebView;
  canWebviewNavigateBack: boolean = false;
  state = { checkingNewUrl: false };

  componentDidMount() {
    if (Platform.OS !== 'android') return;
    BackHandler.addEventListener('hardwareBackPress', this.handleNavigationBack);
  }

  componentWillUnmount() {
    if (Platform.OS !== 'android') return;
    BackHandler.removeEventListener('hardwareBackPress', this.handleNavigationBack);
  }

  renderWebViewLoading = () => <Spinner style={{ alignSelf: 'center', position: 'absolute', top: '50%' }} />;

  handleNavigationBack = () => {
    if (!this.webViewRef || !this.canWebviewNavigateBack) {
      this.props.navigation.goBack();
      return;
    }
    this.webViewRef.goBack();
  };

  onNavigationStateChange = (webViewNavigationState) => {
    const { checkingNewUrl } = this.state;
    if (checkingNewUrl || webViewNavigationState.loading) return;
    this.canWebviewNavigateBack = !!webViewNavigationState.canGoBack;

    const currentWebViewUrl = get(webViewNavigationState, 'url');
    if (isEmpty(validateDeepLink(currentWebViewUrl))) return;

    this.setState({ checkingNewUrl: true }, () => {
      const { executeDeepLink } = this.props;
      // go to previous webview url and not follow deep link as url
      this.webViewRef.stopLoading();
      this.webViewRef.goBack();
      this.setState({ checkingNewUrl: false }, () => executeDeepLink(currentWebViewUrl));
    });
  };

  render() {
    const {
      connectedSmartWallet: {
        address: accountAddress,
        activeDeviceAddress,
      },
      accounts,
      smartWalletState,
    } = this.props;

    const signUpUrl = [
      RECOVERY_PORTAL_URL,
      RECOVERY_PORTAL_URL_PATHS.SIGN_UP,
      accountAddress,
      activeDeviceAddress,
    ].join('/');

    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    const { upgrade: { status: smartWalletUpgradeStatus } } = smartWalletState;
    const sendingBlockedMessage = smartWalletUpgradeStatus === SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED
      ? {
        title: 'To setup Recovery Portal you need to deploy Smart Wallet first',
        message: 'You will have to pay a small fee',
      }
      : smartWalletStatus.sendingBlockedMessage || {};
    const isRecoveryDisabled = !isEmpty(sendingBlockedMessage);

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Recovery Portal Sign Up' }],
          customOnBack: this.handleNavigationBack,
        }}
      >
        <Wrapper style={{ flex: 1 }}>
          {!isRecoveryDisabled &&
            <WebView
              ref={(ref) => { this.webViewRef = ref; }}
              source={{ uri: signUpUrl }}
              onNavigationStateChange={this.onNavigationStateChange}
              renderLoading={this.renderWebViewLoading}
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
  smartWallet: { connectedAccount: connectedSmartWallet },
  smartWallet: smartWalletState,
  accounts: { data: accounts },
}: RootReducerState): $Shape<Props> => ({
  connectedSmartWallet,
  smartWalletState,
  accounts,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  executeDeepLink: (deepLink: string) => dispatch(executeDeepLinkAction(deepLink)),
});

export default connect(mapStateToProps, mapDispatchToProps)(RecoveryPortalSetupSignUp);
