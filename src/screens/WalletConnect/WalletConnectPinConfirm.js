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
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { useNavigation } from 'react-navigation-hooks';
import { Wallet } from 'ethers';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line import/no-extraneous-dependencies
import { formatJsonRpcResult } from '@json-rpc-tools/utils';

// components
import CheckAuth from 'components/CheckAuth';
import Toast from 'components/Toast';

// actions
import { sendAssetAction } from 'actions/assetsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';

// utils
import { signMessage, signPersonalMessage, signTransaction, signTypedData } from 'utils/wallet';
import { isArchanovaAccount } from 'utils/accounts';
import { reportErrorLog } from 'utils/common';
import { parseMessageSignParamsFromCallRequest } from 'utils/walletConnect';

// hooks
import useWalletConnect from 'hooks/useWalletConnect';

// constants
import {
  ETH_SEND_TX,
  ETH_SIGN_TX,
  ETH_SIGN_TYPED_DATA,
  ETH_SIGN_TYPED_DATA_V4,
  PERSONAL_SIGN,
  WALLET_SWITCH_CHAIN,
} from 'constants/walletConnectConstants';
import { SEND_TOKEN_TRANSACTION } from 'constants/navigationConstants';

// selectors
import { activeAccountSelector } from 'selectors';

// types
import type { TransactionPayload, TransactionStatus } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Account } from 'models/Account';

type Props = {
  sendAsset: (
    payload: TransactionPayload,
    privateKey: string,
    callback: (status: TransactionStatus) => void,
    waitForActualTransactionHash: boolean,
  ) => void,
  resetIncorrectPassword: () => void,
  useBiometrics: boolean,
  activeAccount: ?Account,
};

const WalletConnectPinConfirmScreeen = ({ resetIncorrectPassword, useBiometrics, sendAsset, activeAccount }: Props) => {
  const [isChecking, setIsChecking] = useState(false);
  const navigation = useNavigation();
  const {
    approveCallRequest,
    approveV2CallRequest,
    switchEthereumChainConnectorRequest,
    rejectCallRequest,
    rejectV2CallRequest,
  } = useWalletConnect();
  const { t } = useTranslation();

  const callRequest = navigation.getParam('callRequest');
  const transactionPayload = navigation.getParam('transactionPayload');

  const isV2CallRequest = !!callRequest?.topic;

  const dismissScreen = () => {
    resetIncorrectPassword();
    setIsChecking(false);
    navigation.dismiss();
  };

  const handleSendTransaction = (privateKey): void => {
    const statusCallback = (transactionStatus: TransactionStatus) => {
      if (transactionStatus.isSuccess && transactionStatus.hash) {
        if (isV2CallRequest) {
          const formatJSON = formatJsonRpcResult(callRequest.callId, transactionStatus.hash);
          approveV2CallRequest(callRequest, formatJSON);
        } else {
          approveCallRequest(callRequest, transactionStatus.hash);
        }
      } else {
        rejectCallRequest(callRequest);
      }

      dismissScreen();

      navigation.navigate(SEND_TOKEN_TRANSACTION, {
        ...transactionStatus,
        noRetry: true,
        goBackDismiss: true,
        transactionPayload,
      });
    };

    sendAsset(transactionPayload, privateKey, statusCallback, true);
  };

  const handleSignTransaction = async (wallet: Wallet): Promise<?string> => {
    const {
      params: [transaction],
    } = callRequest;

    try {
      const signature = signTransaction(transaction, wallet);
      if (isV2CallRequest) {
        return formatJsonRpcResult(callRequest.callId, signature);
      }
      return signature;
    } catch (e) {
      if (isV2CallRequest) {
        rejectV2CallRequest(callRequest);
      } else {
        rejectCallRequest(callRequest);
      }
      return null;
    }
  };

  const handleSignMessage = async (wallet: Wallet): Promise<?string> => {
    const isLegacyEip1271 = isArchanovaAccount(activeAccount);

    const { method } = callRequest;
    const { message } = parseMessageSignParamsFromCallRequest(callRequest);

    let result;
    try {
      switch (method) {
        case PERSONAL_SIGN:
          const messageRes = await signPersonalMessage(message, wallet, isLegacyEip1271);
          result = isV2CallRequest ? formatJsonRpcResult(callRequest.callId, messageRes) : messageRes;
          break;
        case ETH_SIGN_TYPED_DATA:
        case ETH_SIGN_TYPED_DATA_V4:
          const signedData = await signTypedData(message, wallet, isLegacyEip1271);
          result = isV2CallRequest ? formatJsonRpcResult(callRequest.callId, signedData) : signedData;
          break;
        default:
          const signMessageRes = await signMessage(message, wallet);
          result = isV2CallRequest ? formatJsonRpcResult(callRequest.callId, signMessageRes) : signMessageRes;
      }
    } catch (error) {
      reportErrorLog('WalletConnectPinConfirmScreeen -> handleSignMessage failed', { message, callRequest, error });
    }

    return result;
  };

  const onPinValid = async (pin: string, wallet: Wallet) => {
    setIsChecking(true);
    const { method } = callRequest;

    if (!wallet?.privateKey) {
      rejectCallRequest(callRequest);
      Toast.show({
        message: t('error.transactionFailed.unableToAccessWallet'),
        emoji: 'eyes',
      });
      return;
    }

    if (method === ETH_SEND_TX) {
      handleSendTransaction(wallet.privateKey);
      return;
    }

    if (method === WALLET_SWITCH_CHAIN) {
      await switchEthereumChainConnectorRequest(callRequest);
      Toast.show({
        message: t('toast.walletConnectRequestApproved'),
        emoji: 'ok_hand',
      });
      dismissScreen();

      return;
    }

    const signedResult = method === ETH_SIGN_TX ? await handleSignTransaction(wallet) : await handleSignMessage(wallet);

    if (signedResult) {
      if (isV2CallRequest) {
        approveV2CallRequest(callRequest, signedResult);
      } else {
        approveCallRequest(callRequest, signedResult);
      }

      Toast.show({
        message: t('toast.walletConnectRequestApproved'),
        emoji: 'ok_hand',
      });
    } else {
      if (isV2CallRequest) {
        rejectV2CallRequest(callRequest);
      } else {
        rejectCallRequest(callRequest);
      }

      Toast.show({
        message: t('toast.walletConnectRequestRejected'),
        emoji: 'eyes',
      });
    }

    dismissScreen();
  };

  const onNavigationBack = () => {
    navigation.goBack(null);
    resetIncorrectPassword();
  };

  return (
    <CheckAuth
      onPinValid={onPinValid}
      isChecking={isChecking}
      headerProps={{ onBack: onNavigationBack }}
      enforcePin={!useBiometrics}
    />
  );
};

const mapStateToProps = ({
  appSettings: {
    data: { useBiometrics },
  },
}: RootReducerState): $Shape<Props> => ({
  useBiometrics,
});

const structuredSelector = createStructuredSelector({
  activeAccount: activeAccountSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  sendAsset: (
    transaction: TransactionPayload,
    privateKey: string,
    callback: (status: TransactionStatus) => void,
    waitForActualTransactionHash: boolean = false,
  ) => dispatch(sendAssetAction(transaction, privateKey, callback, waitForActualTransactionHash)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(WalletConnectPinConfirmScreeen);
