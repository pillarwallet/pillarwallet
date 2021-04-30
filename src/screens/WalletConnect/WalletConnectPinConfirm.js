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
import { createStructuredSelector } from 'reselect';

// components
import CheckAuth from 'components/CheckAuth';

// actions
import { approveCallRequestAction, rejectCallRequestAction } from 'actions/walletConnectActions';
import { sendAssetAction } from 'actions/assetsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';

// utils
import { signMessage, signPersonalMessage, signTransaction, signTypedData } from 'utils/wallet';
import { isArchanovaAccount } from 'utils/accounts';

// constants
import {
  ETH_SEND_TX,
  ETH_SIGN,
  ETH_SIGN_TX,
  ETH_SIGN_TYPED_DATA,
  PERSONAL_SIGN,
} from 'constants/walletConnectConstants';
import { SEND_TOKEN_TRANSACTION } from 'constants/navigationConstants';

// selectors
import { activeAccountSelector } from 'selectors';

// types
import type { TransactionPayload } from 'models/Transaction';
import type { NavigationScreenProp } from 'react-navigation';
import type { CallRequest } from 'models/WalletConnect';
import type { TransactionStatus } from 'actions/assetsActions';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Account } from 'models/Account';


type Props = {
  requests: CallRequest[],
  navigation: NavigationScreenProp<*>,
  approveCallRequest: (callId: number, result: any) => void,
  rejectCallRequest: (callId: number, errorMessage?: string) => void,
  sendAsset: (
    payload: TransactionPayload,
    callback: (status: TransactionStatus) => void,
    waitForActualTransactionHash: boolean,
  ) => void,
  resetIncorrectPassword: () => void,
  useBiometrics: boolean,
  activeAccount: ?Account,
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
      rejectCallRequest(request.callId);
    }
    resetIncorrectPassword();
    navigation.dismiss();
  };

  completeCheckingAndDismiss = () => this.setState({ isChecking: false }, this.handleDismissal);

  handleCallRequest = (pin: string, wallet: Object) => {
    const { request } = this;

    if (!request) {
      return;
    }

    let callback = () => {};

    switch (request.method) {
      case ETH_SEND_TX:
        callback = () => this.handleSendTransaction(request);
        break;
      case ETH_SIGN_TX:
        callback = () => this.handleSignTransaction(request, wallet);
        break;
      case ETH_SIGN:
      case PERSONAL_SIGN:
        callback = () => this.handleSignMessage(request, wallet);
        break;
      case ETH_SIGN_TYPED_DATA:
        callback = () => this.handleSignTypedData(request, wallet);
        break;
      default:
        break;
    }

    this.setState({ isChecking: true }, callback);
  };

  handleSendTransaction = (request: CallRequest) => {
    const {
      sendAsset,
      approveCallRequest,
      rejectCallRequest,
      navigation,
    } = this.props;

    const transactionPayload = navigation.getParam('transactionPayload', {});
    const statusCallback = (transactionStatus: TransactionStatus) => {
      if (transactionStatus.isSuccess) {
        approveCallRequest(request.callId, transactionStatus.hash);
      } else {
        rejectCallRequest(request.callId);
      }

      this.setState({ isChecking: false }, () => {
        this.handleDismissal();
        this.handleNavigationToTransactionState(transactionStatus);
      });
    };

    sendAsset(transactionPayload, statusCallback, true);
  };

  handleSignTransaction = async (request: CallRequest, wallet: Object) => {
    const { approveCallRequest, rejectCallRequest } = this.props;
    const trx = request.params[0];
    try {
      const result = await signTransaction(trx, wallet);
      approveCallRequest(request.callId, result);
    } catch (error) {
      rejectCallRequest(request.callId);
    }
    this.completeCheckingAndDismiss();
  };

  handleSignMessage = async (request: CallRequest, wallet: Object) => {
    const { approveCallRequest, rejectCallRequest, activeAccount } = this.props;
    let message = '';
    try {
      let result = null;
      if (request.method === PERSONAL_SIGN) {
        const isLegacyEIP1721 = isArchanovaAccount(activeAccount);
        message = request.params[0]; // eslint-disable-line
        result = await signPersonalMessage(message, wallet, isLegacyEIP1721);
      } else {
        message = request.params[1]; // eslint-disable-line
        result = await signMessage(message, wallet);
      }
      approveCallRequest(request.callId, result);
    } catch (error) {
      rejectCallRequest(request.callId, error.toString());
    }
    this.completeCheckingAndDismiss();
  };

  handleSignTypedData = async (request: CallRequest, wallet: Object) => {
    const { approveCallRequest, rejectCallRequest, activeAccount } = this.props;
    const isLegacyEIP1721 = isArchanovaAccount(activeAccount);
    try {
      const message = request.params[1]; // eslint-disable-line
      const result = await signTypedData(message, wallet, isLegacyEIP1721);
      approveCallRequest(request.callId, result);
    } catch (error) {
      rejectCallRequest(request.callId, error.toString());
    }
    this.completeCheckingAndDismiss();
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

  render() {
    const { isChecking } = this.state;
    const { useBiometrics } = this.props;
    return (
      <CheckAuth
        onPinValid={this.handleCallRequest}
        isChecking={isChecking}
        headerProps={{ onBack: this.handleBack }}
        enforcePin={!useBiometrics}
      />
    );
  }
}

const mapStateToProps = ({
  walletConnect: { requests },
  appSettings: { data: { useBiometrics } },
}: RootReducerState): $Shape<Props> => ({
  useBiometrics,
  requests,
});

const structuredSelector = createStructuredSelector({
  activeAccount: activeAccountSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  approveCallRequest: (callId: number, result: any) => dispatch(approveCallRequestAction(callId, result)),
  rejectCallRequest: (callId: number, errorMessage?: string) => dispatch(rejectCallRequestAction(callId, errorMessage)),
  sendAsset: (
    transaction: TransactionPayload,
    callback: (status: TransactionStatus) => void,
    waitForActualTransactionHash: boolean = false,
  ) => dispatch(sendAssetAction(transaction, callback, waitForActualTransactionHash)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(WalletConnectPinConfirmScreeen);
