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
import t from 'translations/translate';

// Components
import CheckAuth from 'components/CheckAuth';

// Actions
import { sendAssetAction } from 'actions/assetsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { logEventAction } from 'actions/analyticsActions';

// Constants
import { SEND_TOKEN_TRANSACTION } from 'constants/navigationConstants';

// Types
import type { NavigationScreenProp } from 'react-navigation';
import type { TransactionPayload, TransactionStatus } from 'models/Transaction';
import type { Account } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

// Utils
import { isLogV2AppEvents } from 'utils/environment';
import { getActiveAccountAddress } from 'utils/accounts';

type Props = {
  navigation: NavigationScreenProp<*>,
  sendAsset: (
    transactionPayload: TransactionPayload,
    callback: (status: TransactionStatus) => void,
  ) => void,
  resetIncorrectPassword: () => void,
  accounts: Account[],
  isOnline: boolean,
  logEvent: (name: string, properties: Object) => void,
  useBiometrics: boolean,
};

type State = {
  transactionPayload: TransactionPayload,
  isChecking: boolean,
  errorMessage?: ?string;
};

class SendTokenPinConfirmScreen extends React.Component<Props, State> {
  source: string;
  goBackDismiss: boolean;

  constructor(props: Props) {
    super(props);
    const { navigation } = props;
    const transactionPayload = navigation.getParam('transactionPayload', { });
    this.source = navigation.getParam('source', '');
    this.goBackDismiss = navigation.getParam('goBackDismiss', false);
    this.state = {
      transactionPayload,
      isChecking: false,
    };
  }

  handleTransaction = async () => {
    const {
      sendAsset,
      isOnline,
      logEvent,
      accounts,
    } = this.props;
    const { transactionPayload } = this.state;

    if (!isOnline) {
      this.setState({
        errorMessage: t('error.transactionFailed.offline'),
      });
      return;
    }
    const senderAccountAddress = getActiveAccountAddress(accounts);
    const { to: recipient } = transactionPayload;

    this.setState({
      isChecking: true,
    }, () => {
      logEvent('transaction_sent', { source: this.source });
      isLogV2AppEvents() && logEvent('v2_transaction_sent', { to: recipient, from: senderAccountAddress });
      sendAsset(transactionPayload, this.navigateToTransactionState);
    });
  };

  navigateToTransactionState = (params: ?Object) => {
    const { navigation } = this.props;
    const { transactionPayload } = this.state;
    const transactionType = navigation.getParam('transactionType', '');

    navigation.navigate(SEND_TOKEN_TRANSACTION, { ...params, transactionPayload, transactionType });
  };

  handleBack = () => {
    const { navigation, resetIncorrectPassword } = this.props;
    if (this.goBackDismiss) {
      navigation.dismiss();
    } else {
      navigation.goBack(null);
    }
    resetIncorrectPassword();
  };

  render() {
    const { isChecking, errorMessage } = this.state;
    const { useBiometrics } = this.props;

    return (
      <CheckAuth
        onPinValid={this.handleTransaction}
        isChecking={isChecking}
        pinError={!!errorMessage}
        errorMessage={errorMessage}
        headerProps={{ onBack: this.handleBack }}
        enforcePin={!useBiometrics}
      />
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  session: { data: { isOnline } },
  appSettings: { data: { useBiometrics } },
}: RootReducerState): $Shape<Props> => ({
  useBiometrics,
  accounts,
  isOnline,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  sendAsset: (
    transaction: TransactionPayload,
    callback: (status: TransactionStatus) => void,
  ) => dispatch(sendAssetAction(transaction, callback)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  logEvent: (name: string, properties: Object) => dispatch(logEventAction(name, properties)),
});


export default connect(mapStateToProps, mapDispatchToProps)(SendTokenPinConfirmScreen);
