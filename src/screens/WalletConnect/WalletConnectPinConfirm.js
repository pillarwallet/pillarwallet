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
import CheckPin from 'components/CheckPin';
import { approveCallRequestAction, rejectCallRequestAction } from 'actions/walletConnectActions';
import { sendAssetAction } from 'actions/assetsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { SEND_TOKEN_TRANSACTION } from 'constants/navigationConstants';
import { signMessage, signPersonalMessage, signTransaction } from 'utils/wallet';

import type { TransactionPayload } from 'models/Transaction';
import type { NavigationScreenProp } from 'react-navigation';
import type { CallRequest } from 'models/WalletConnect';

type Props = {
  requests: CallRequest[],
  navigation: NavigationScreenProp<*>,
  approveCallRequest: (callId: number, result: any) => Function,
  rejectCallRequest: (callId: number, errorMsg?: string) => Function,
  sendAsset: (payload: TransactionPayload, wallet: Object, navigate: Function) => Function,
  resetIncorrectPassword: () => Function,
};

type State = {
  isChecking: boolean,
};

class WalletConnectPinConfirmScreeen extends React.Component<Props, State> {
  request: ?CallRequest;

  state = {
    isChecking: false,
  };

  componentDidMount() {
    const { navigation, requests } = this.props;

    const requestCallId = +navigation.getParam('callId', 0);
    const request = requests.find(({ callId }) => callId === requestCallId);
    if (!request) {
      return;
    }

    this.request = request;
  }

  handleDismissal = async () => {
    const { navigation, rejectCallRequest, resetIncorrectPassword } = this.props;
    const { request } = this;
    if (request) {
      await rejectCallRequest(request.callId);
    }
    resetIncorrectPassword();
    navigation.dismiss();
  };

  handleCallRequest = (pin: string, wallet: Object) => {
    const { request } = this;

    if (!request) {
      return;
    }

    let callback = () => {};

    switch (request.method) {
      case 'eth_sendTransaction':
        callback = () => this.handleSendTransaction(request, wallet);
        break;
      case 'eth_signTransaction':
        callback = () => this.handleSignTransaction(request, wallet);
        break;
      case 'eth_sign':
      case 'personal_sign':
        callback = () => this.handleSignMessage(request, wallet);
        break;
      default:
        break;
    }

    this.setState({ isChecking: true }, callback);
  };

  handleSendTransaction = (request: CallRequest, wallet: Object) => {
    const {
      sendAsset, approveCallRequest, rejectCallRequest, navigation,
    } = this.props;
    const transactionPayload = navigation.getParam('transactionPayload', {});
    sendAsset(transactionPayload, wallet, async (txStatus: Object) => {
      if (txStatus.isSuccess) {
        await approveCallRequest(request.callId, txStatus.txHash);
      } else {
        await rejectCallRequest(request.callId);
      }
      this.setState(
        {
          isChecking: false,
        },
        () => {
          this.handleDismissal();
          this.handleNavigationToTransactionState(txStatus);
        },
      );
    });
  };

  handleSignTransaction = async (request: CallRequest, wallet: Object) => {
    const { approveCallRequest, rejectCallRequest } = this.props;
    const trx = request.params[0];
    try {
      const result = await signTransaction(trx, wallet);
      await approveCallRequest(request.callId, result);
    } catch (error) {
      await rejectCallRequest(request.callId);
    }
    this.setState(
      {
        isChecking: false,
      },
      () => this.handleDismissal(),
    );
  };

  handleSignMessage = async (request: CallRequest, wallet: Object) => {
    const { approveCallRequest, rejectCallRequest } = this.props;
    let message = '';
    try {
      let result = null;
      if (request.method === 'personal_sign') {
        message = request.params[0]; // eslint-disable-line
        result = await signPersonalMessage(message, wallet);
      } else {
        message = request.params[1]; // eslint-disable-line
        result = await signMessage(message, wallet);
      }
      await approveCallRequest(request.callId, result);
    } catch (error) {
      await rejectCallRequest(request.callId, error.toString());
    }
    this.setState(
      {
        isChecking: false,
      },
      () => this.handleDismissal(),
    );
  };

  handleNavigationToTransactionState = (params: ?Object) => {
    const { navigation } = this.props;
    const transactionPayload = navigation.getParam('transactionPayload', {});

    navigation.navigate(SEND_TOKEN_TRANSACTION, { ...params, transactionPayload });
  };

  handleBack = () => {
    const { navigation, resetIncorrectPassword } = this.props;
    navigation.goBack(null);
    resetIncorrectPassword();
  };

  handleDismissal = () => {
    const { navigation, resetIncorrectPassword } = this.props;
    navigation.dismiss();
    resetIncorrectPassword();
  };

  render() {
    const { isChecking } = this.state;
    return (
      <CheckPin
        onPinValid={this.handleCallRequest}
        isChecking={isChecking}
        headerProps={{ onBack: this.handleBack }}
      />
    );
  }
}

const mapStateToProps = ({
  walletConnect: { requests },
}) => ({
  requests,
});

const mapDispatchToProps = dispatch => ({
  approveCallRequest: (callId: number, result: any) => {
    dispatch(approveCallRequestAction(callId, result));
  },
  rejectCallRequest: (callId: number, errorMsg?: string) => {
    dispatch(rejectCallRequestAction(callId, errorMsg));
  },
  sendAsset: (transaction: TransactionPayload, wallet: Object, navigate) => {
    dispatch(sendAssetAction(transaction, wallet, navigate));
  },
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(WalletConnectPinConfirmScreeen);
