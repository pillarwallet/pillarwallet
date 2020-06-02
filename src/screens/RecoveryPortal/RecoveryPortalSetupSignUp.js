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
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';

// components
import RecoveryPortalWebView from 'components/RecoveryPortalWebView';

// constants
import { RECOVERY_PORTAL_URL_PATHS } from 'constants/recoveryPortalConstants';
import { RECOVERY_PORTAL_SETUP_CONNECT_DEVICE } from 'constants/navigationConstants';

// types
import type { Accounts } from 'models/Account';
import type { ConnectedSmartWalletAccount } from 'models/SmartWalletAccount';
import type { RootReducerState } from 'reducers/rootReducer';


type Props = {
  navigation: NavigationScreenProp,
  connectedSmartWallet: ConnectedSmartWalletAccount,
  executeDeepLink: (deepLink: string) => void,
  accounts: Accounts,
  smartWalletState: Object,
};

const RecoveryPortalSetupSignUp = ({
  navigation,
  connectedSmartWallet: {
    address: accountAddress,
    activeDeviceAddress,
  },
}: Props) => {
  const signUpPath = [
    RECOVERY_PORTAL_URL_PATHS.SIGN_UP,
    accountAddress,
    activeDeviceAddress,
  ].join('/');

  const onWebViewMessage = (message) => {
    if (!message?.nativeEvent?.data) return;
    try {
      const { deviceAddress } = JSON.parse(message.nativeEvent.data);
      if (!deviceAddress) return;
      navigation.navigate({
        routeName: RECOVERY_PORTAL_SETUP_CONNECT_DEVICE,
        params: { deviceAddress },
      });
    } catch (e) {
      //
    }
  };

  return (
    <RecoveryPortalWebView
      title="Recovery Portal Sign Up"
      onWebViewMessage={onWebViewMessage}
      navigation={navigation}
      urlPath={signUpPath}
      goBackDismiss
    />
  );
};

const mapStateToProps = ({
  smartWallet: { connectedAccount: connectedSmartWallet },
}: RootReducerState): $Shape<Props> => ({
  connectedSmartWallet,
});

export default connect(mapStateToProps)(RecoveryPortalSetupSignUp);
