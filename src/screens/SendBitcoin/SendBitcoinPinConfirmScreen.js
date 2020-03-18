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
import CheckPin from 'components/CheckPin';
import { sendTransactionAction } from 'actions/bitcoinActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { logEventAction } from 'actions/analyticsActions';
import { SEND_BITCOIN_TRANSACTION } from 'constants/navigationConstants';

import type { BitcoinTransactionPlan } from 'models/Bitcoin';
import type { EthereumWallet } from 'models/Wallet';

type Props = {
  navigation: NavigationScreenProp<*>,
  sendAsset: (
    wallet: EthereumWallet,
    transactionPayload: BitcoinTransactionPlan,
    navigate: Function,
  ) => void,
  resetIncorrectPassword: () => void,
  logEvent: (name: string, properties: Object) => void,
}

type State = {
  transactionPayload: BitcoinTransactionPlan,
  isChecking: boolean,
  errorMessage?: ?string;
};

class SendBitcoinPinConfirmScreen extends React.Component<Props, State> {
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

  handleTransaction = async (pin: string, wallet: EthereumWallet) => {
    const {
      sendAsset,
      logEvent,
    } = this.props;
    const { transactionPayload } = this.state;

    this.setState({
      isChecking: true,
    }, () => {
      logEvent('transaction_sent', { source: this.source });
      sendAsset(wallet, transactionPayload, this.navigateToTransactionState);
    });
  };

  navigateToTransactionState = (params: ?Object) => {
    const { navigation } = this.props;
    const { transactionPayload } = this.state;
    navigation.navigate(SEND_BITCOIN_TRANSACTION, { ...params, transactionPayload });
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
      <CheckPin
        onPinValid={this.handleTransaction}
        isChecking={isChecking}
        pinError={!!errorMessage}
        revealMnemonic
        errorMessage={errorMessage}
        headerProps={{ onBack: this.handleBack }}
      />
    );
  }
}

const mapDispatchToProps = (dispatch): $Shape<Props> => ({
  sendAsset: (wallet: EthereumWallet, transaction: BitcoinTransactionPlan, callback) =>
    dispatch(sendTransactionAction(wallet, transaction, callback)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  logEvent: (name: string, properties: Object) => dispatch(logEventAction(name, properties)),
});

export default connect(null, mapDispatchToProps)(SendBitcoinPinConfirmScreen);
