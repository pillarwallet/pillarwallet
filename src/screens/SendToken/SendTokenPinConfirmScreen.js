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
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { Container } from 'components/Layout';
import CheckPin from 'components/CheckPin';
import Header from 'components/Header';
import ErrorMessage from 'components/ErrorMessage';
import { sendAssetAction } from 'actions/assetsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { initSmartWalletSdkAction } from 'actions/smartWalletActions';
import { SEND_TOKEN_TRANSACTION } from 'constants/navigationConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { getActiveAccountType } from 'utils/accounts';

import type { TransactionPayload } from 'models/Transaction';
import type { Accounts } from 'models/Account';

type Props = {
  navigation: NavigationScreenProp<*>,
  sendAsset: (transactionPayload: TransactionPayload, wallet: Object, navigate: Function) => Function,
  resetIncorrectPassword: () => Function,
  accounts: Accounts,
  isOnline: boolean,
  smartWalletSdkInitialized: boolean,
  smartWalletFeatureEnabled: boolean,
  initSmartWalletSdk: Function,
}

type State = {
  transactionPayload: TransactionPayload,
  isChecking: boolean,
  errorMessage?: ?string;
};

class SendTokenPinConfirmScreen extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const transactionPayload = this.props.navigation.getParam('transactionPayload', {});
    this.state = {
      transactionPayload,
      isChecking: false,
    };
  }

  handleDismissal = () => {
    const { navigation, resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    navigation.dismiss();
  };

  handleTransaction = async (pin: string, wallet: Object) => {
    const {
      sendAsset,
      smartWalletFeatureEnabled,
      smartWalletSdkInitialized,
      isOnline,
      initSmartWalletSdk,
      accounts,
    } = this.props;
    const { transactionPayload } = this.state;
    const activeAccountType = getActiveAccountType(accounts);
    const isSmartWallet = smartWalletFeatureEnabled && activeAccountType === ACCOUNT_TYPES.SMART_WALLET;
    if (isSmartWallet && !isOnline) {
      this.setState({
        errorMessage: 'Cannot make Smart Wallet transaction offline',
      });
      return;
    }
    this.setState({
      isChecking: true,
    }, async () => {
      if (isSmartWallet && !smartWalletSdkInitialized) {
        // make sure sdk is inited before next step
        await initSmartWalletSdk(wallet.privateKey);
      }
      sendAsset(transactionPayload, wallet, this.handleNavigationToTransactionState);
    });
  };

  handleNavigationToTransactionState = (params: ?Object) => {
    const { navigation } = this.props;
    const { transactionPayload } = this.state;
    navigation.navigate(SEND_TOKEN_TRANSACTION, { ...params, transactionPayload });
  };

  handleBack = () => {
    const { navigation, resetIncorrectPassword } = this.props;
    navigation.goBack(null);
    resetIncorrectPassword();
  };

  render() {
    const { isChecking, errorMessage } = this.state;
    return (
      <Container>
        <Header
          onBack={this.handleBack}
          title="enter pincode"
        />
        {!!errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        <CheckPin
          onPinValid={this.handleTransaction}
          isChecking={isChecking}
          pinError={!!errorMessage}
        />
      </Container>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  session: { data: { isOnline } },
  smartWallet: { sdkInitialized: smartWalletSdkInitialized },
  featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
}) => ({
  accounts,
  isOnline,
  smartWalletSdkInitialized,
  smartWalletFeatureEnabled,
});

const mapDispatchToProps = (dispatch) => ({
  sendAsset: (transaction: TransactionPayload, wallet: Object, navigate) => {
    dispatch(sendAssetAction(transaction, wallet, navigate));
  },
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  initSmartWalletSdk: (walletPrivateKey: string) => dispatch(initSmartWalletSdkAction(walletPrivateKey)),
});


export default connect(mapStateToProps, mapDispatchToProps)(SendTokenPinConfirmScreen);
