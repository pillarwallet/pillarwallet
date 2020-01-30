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

// components
import { Wrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Spinner from 'components/Spinner';

// util
import { validateDeepLink } from 'utils/deepLink';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { ConnectedSmartWalletAccount } from 'models/SmartWalletAccount';


type Props = {
  navigation: NavigationScreenProp,
  connectedSmartWallet: ConnectedSmartWalletAccount,
  executeDeepLink: (deepLink: string) => void,
};

type State = {
  currentWebViewUrl: ?string,
  checkingNewUrl: boolean,
};

class RecoveryPortalSignUp extends React.Component<Props, State> {
  webViewRef: WebView;
  initialUrl: ?string = null;
  state = {
    currentWebViewUrl: null,
    checkingNewUrl: false,
  };

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

      // if previous url was set (navigation happened) then new url might be deep link, let's parse it right away
      if (lastWebViewUrl && !isEmpty(validateDeepLink(currentWebViewUrl))) {
        const { executeDeepLink } = this.props;
        // redirect to last url because deep link is detected as new page

        // set webview browser nav to previous http url and not follow deep link as url
        this.webViewRef.stopLoading();
        this.webViewRef.injectJavaScript(`window.location = "${lastWebViewUrl}";`);

        this.setState({ checkingNewUrl: false }, () => executeDeepLink(currentWebViewUrl));
        return;
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
    const {
      connectedSmartWallet: {
        address: accountAddress,
        activeDeviceAddress,
      },
    } = this.props;

    const signUpUrl = [
      RECOVERY_PORTAL_URL,
      RECOVERY_PORTAL_URL_PATHS.SIGN_UP,
      accountAddress,
      activeDeviceAddress,
    ].join('/');

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Recovery Portal Sign Up' }],
          customOnBack: this.handleNavigationBack,
        }}
      >
        <Wrapper style={{ flex: 1 }}>
          <WebView
            ref={(ref) => { this.webViewRef = ref; }}
            source={{ uri: signUpUrl }}
            onNavigationStateChange={this.onNavigationStateChange}
            renderLoading={this.renderWebViewLoading}
            originWhitelist={['*']}
            hideKeyboardAccessoryView
            startInLoadingState
            incognito
          />
        </Wrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  smartWallet: { connectedAccount: connectedSmartWallet },
}: RootReducerState): $Shape<Props> => ({
  connectedSmartWallet,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  executeDeepLink: (deepLink: string) => dispatch(executeDeepLinkAction(deepLink)),
});

export default connect(mapStateToProps, mapDispatchToProps)(RecoveryPortalSignUp);
