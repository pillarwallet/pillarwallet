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
import type { TransactionPayload } from 'models/Transaction';
import { onWalletConnectApproveCallRequest } from 'actions/walletConnectActions';
import { sendAssetAction } from 'actions/assetsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { SEND_TOKEN_TRANSACTION } from 'constants/navigationConstants';
import { signMessage, signTransaction } from 'utils/wallet';

type Props = {
  navigation: NavigationScreenProp<*>,
  approveCallRequest: (peerId: string, callId: string, result: any) => Function,
  sendAsset: (payload: TransactionPayload, wallet: Object, navigate: Function) => Function,
  resetIncorrectPassword: () => Function,
};

type State = {
  payload: TransactionPayload,
  isChecking: boolean,
};

class WalletConnectPinConfirmScreeen extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const payload = this.props.navigation.getParam('payload', {});
    this.state = {
      payload,
      isChecking: false,
    };
  }

  handleDismissal = () => {
    const { navigation, resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    navigation.dismiss();
  };

  handleCallRequest = (pin: string, wallet: Object) => {
    const { approveCallRequest, navigation } = this.props;
    const peerId = navigation.getParam('peerId', {});
    const payload = navigation.getParam('payload', {});

    let callback = () => {};

    switch (payload.method) {
      case 'eth_sendTransaction':
        callback = () => this.handleTransaction(wallet);
        break;
      case 'eth_signTransaction':
        callback = async () => {
          const trx = payload.params[0];
          const result = await signTransaction(trx, wallet);
          approveCallRequest(peerId, payload.id, result);
        };
        break;
      case 'eth_sign':
      case 'personal_sign':
        callback = async () => {
          const message = payload.params[1];
          const result = await signMessage(message, wallet);
          approveCallRequest(peerId, payload.id, result);
        };
        break;
      default:
        break;
    }

    this.setState(
      {
        isChecking: true,
      },
      callback,
    );
  };

  handleTransaction = (wallet: Object) => {
    const { sendAsset, approveCallRequest, navigation } = this.props;
    const peerId = navigation.getParam('peerId', {});
    const payload = navigation.getParam('payload', {});
    const transactionPayload = navigation.getParam('transactionPayload', {});
    this.setState(
      {
        isChecking: true,
      },
      () =>
        sendAsset(transactionPayload, wallet, (txStatus: Object) => {
          approveCallRequest(peerId, payload.id, txStatus.txHash);
          this.handleNavigationToTransactionState();
        }),
    );
  };

  handleNavigationToTransactionState = (params: ?Object) => {
    const { navigation } = this.props;
    const { payload } = this.state;
    navigation.navigate(SEND_TOKEN_TRANSACTION, { ...params, payload });
  };

  handleBack = () => {
    const { navigation, resetIncorrectPassword } = this.props;
    navigation.goBack(null);
    resetIncorrectPassword();
  };

  render() {
    const { isChecking } = this.state;
    return (
      <Container>
        <Header onBack={this.handleBack} title="enter pincode" />
        <CheckPin onPinValid={this.handleTransaction} isChecking={isChecking} />
      </Container>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  approveCallRequest: (peerId: string, callId: string, result: any) => {
    dispatch(onWalletConnectApproveCallRequest(peerId, callId, result));
  },
  sendAsset: (transaction: TransactionPayload, wallet: Object, navigate) => {
    dispatch(sendAssetAction(transaction, wallet, navigate));
  },
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(
  null,
  mapDispatchToProps,
)(WalletConnectPinConfirmScreeen);
