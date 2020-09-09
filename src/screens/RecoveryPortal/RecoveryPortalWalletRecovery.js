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
  temporaryWallet: ?EthereumWallet,
  isRecoveryPending: boolean,
  initRecoveryPortalWalletRecover: () => void,
};

const RecoveryPortalWalletRecovery = ({
  navigation,
  temporaryWallet,
  isRecoveryPending,
  initRecoveryPortalWalletRecover,
}: Props) => {
  useEffect(() => {
    initRecoveryPortalWalletRecover();
  }, []);

  let webViewRef;
  const showWebView = !!temporaryWallet || isRecoveryPending;

  const onWebViewMessage = (message) => {
    if (!webViewRef || message?.nativeEvent?.data !== 'getRecoveryDeviceAddress' || !temporaryWallet) return;
    /* eslint-disable i18next/no-literal-string */
    webViewRef.injectJavaScript(`
      var event = new CustomEvent("recoveryDeviceAddressAdded", {
        detail: { address: "${temporaryWallet.address}" }
      });
      document.dispatchEvent(event);
    `);
    /* eslint-enable i18next/no-literal-string */
  };

  return (
    <RecoveryPortalWebView
      onRef={(ref) => { webViewRef = ref; }}
      isVisible={showWebView}
      onWebViewMessage={onWebViewMessage}
      navigation={navigation}
    />
  );
};

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
