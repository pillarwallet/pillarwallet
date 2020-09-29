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
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { initRecoveryPortalWalletRecoverAction } from 'actions/recoveryPortalActions';

// components
import RecoveryPortalWebView from 'components/RecoveryPortalWebView';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { EthereumWallet } from 'models/Wallet';


type Props = {
  navigation: NavigationScreenProp,
  wallet: ?EthereumWallet,
  initRecoveryPortalWalletRecover: () => void,
};

const RecoveryPortalWalletRecovery = ({
  navigation,
  wallet,
  initRecoveryPortalWalletRecover,
}: Props) => {
  useEffect(() => {
    initRecoveryPortalWalletRecover();
  }, []);

  let webViewRef;

  const onWebViewMessage = (message) => {
    if (!webViewRef || message?.nativeEvent?.data !== 'getRecoveryDeviceAddress' || !wallet) return;
    webViewRef.injectJavaScript(`
      var event = new CustomEvent("recoveryDeviceAddressAdded", {
        detail: { address: "${wallet.address}" }
      });
      document.dispatchEvent(event);
    `);
  };

  return (
    <RecoveryPortalWebView
      onRef={(ref) => { webViewRef = ref; }}
      isVisible={!!wallet}
      onWebViewMessage={onWebViewMessage}
      navigation={navigation}
    />
  );
};

const mapStateToProps = ({
  onboarding: { wallet },
}: RootReducerState): $Shape<Props> => ({
  wallet,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  initRecoveryPortalWalletRecover: () => dispatch(initRecoveryPortalWalletRecoverAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(RecoveryPortalWalletRecovery);
