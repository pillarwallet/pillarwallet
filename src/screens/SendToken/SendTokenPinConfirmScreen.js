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
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import { Container } from 'components/Layout';
import CheckPin from 'components/CheckPin';
import Header from 'components/Header';
import ErrorMessage from 'components/ErrorMessage';
import { sendAssetAction } from 'actions/assetsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { logEventAction } from 'actions/analyticsActions';
import { SEND_TOKEN_TRANSACTION } from 'constants/navigationConstants';

import type { TransactionPayload } from 'models/Transaction';
import type { Accounts } from 'models/Account';

type Props = {
  navigation: NavigationScreenProp<*>,
  sendAsset: (transactionPayload: TransactionPayload, wallet: Object, navigate: Function) => void,
  resetIncorrectPassword: () => void,
  accounts: Accounts,
  isOnline: boolean,
  logEvent: (name: string, properties: Object) => void,
}

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
    const transactionPayload = navigation.getParam('transactionPayload', {});
    this.source = navigation.getParam('source', '');
    this.goBackDismiss = navigation.getParam('goBackDismiss', false);
    this.state = {
      transactionPayload,
      isChecking: false,
    };
  }

  handleTransaction = async (pin: string, wallet: Object) => {
    const {
      sendAsset,
      isOnline,
      logEvent,
    } = this.props;
    const { transactionPayload } = this.state;

    if (!isOnline) {
      this.setState({
        errorMessage: 'You can\'t send transaction while offline',
      });
      return;
    }

    this.setState({
      isChecking: true,
    }, () => {
      logEvent('transaction_sent', { source: this.source });
      sendAsset(transactionPayload, wallet, this.navigateToTransactionState);
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

    return (
      <Container>
        <Header
          onBack={this.handleBack}
          title="Enter pincode"
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
}: RootReducerState): $Shape<Props> => ({
  accounts,
  isOnline,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  sendAsset: (transaction: TransactionPayload, wallet: Object, callback) => {
    dispatch(sendAssetAction(transaction, wallet, callback));
  },
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  logEvent: (name: string, properties: Object) => dispatch(logEventAction(name, properties)),
});


export default connect(mapStateToProps, mapDispatchToProps)(SendTokenPinConfirmScreen);
