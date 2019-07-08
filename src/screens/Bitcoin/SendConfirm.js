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
import { Keyboard } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import {
  formatBtc,
  satoshisToBtc,
} from 'utils/bitcoin';
import { BITCOIN_SCREEN } from 'constants/navigationConstants';
import type {
  BitcoinAddress,
  BitcoinUtxo,
  BitcoinTransactionPlan,
} from 'models/Bitcoin';
import { sendTransactionAction } from 'actions/bitcoinActions';
import SendConfirm from 'components/SendConfirm';
import { Container } from 'components/Layout';
import CheckPin from 'components/CheckPin';
import Header from 'components/Header';

type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  addresses: BitcoinAddress[],
  unspentTransactions: BitcoinUtxo[],
  sendTransaction: (plan: BitcoinTransactionPlan) => void,
};

type State = {
  userConfirmed: boolean,
  isChecking: boolean,
};

class SendBitcoinConfirm extends React.Component<Props, State> {
  scroll: Object;
  plan: BitcoinTransactionPlan;

  state = {
    userConfirmed: false,
    isChecking: false,
  };

  constructor(props) {
    super(props);
    this.scroll = React.createRef();

    this.plan = this.props.navigation.getParam('plan', undefined);
  }

  handleFormSubmit = () => {
    Keyboard.dismiss();

    this.setState({ userConfirmed: true });
  };

  sendTransaction = async () => {
    this.props.sendTransaction(this.plan);
    this.props.navigation.navigate(BITCOIN_SCREEN);
  }

  goBack(): void {
    const { navigation } = this.props;

    navigation.goBack(null);
  }

  closePinScreen() {
    this.setState({ userConfirmed: false });
  }

  renderConfirm() {
    const { session } = this.props;

    const {
      fee,
      outputs,
    } = this.plan;
    const targetOutput = outputs.find(({ isChange }) => !isChange) || {};
    const { value, address } = targetOutput;

    return (
      <SendConfirm
        goBack={() => this.goBack()}
        formattedAmount={formatBtc(satoshisToBtc(value))}
        formattedFee={formatBtc(satoshisToBtc(fee))}
        symbol="BTC"
        targetAddress={address}
        isOnline={session.isOnline}
        onConfirm={this.handleFormSubmit}
      />
    );
  }

  renderPin() {
    const {
      isChecking,
    } = this.state;

    return (
      <Container>
        <Header
          onBack={() => this.closePinScreen()}
          title="enter pincode"
        />
        <CheckPin
          onPinValid={this.sendTransaction}
          isChecking={isChecking}
        />
      </Container>
    );
  }

  render() {
    const { userConfirmed } = this.state;

    if (userConfirmed) {
      return this.renderPin();
    }

    return this.renderConfirm();
  }
}

const mapStateToProps = ({
  session: { data: session },
  bitcoin: {
    data: { unspentTransactions },
  },
}) => ({
  session,
  unspentTransactions,
});

const mapDispatchToProps = (dispatch) => ({
  sendTransaction: (plan: BitcoinTransactionPlan) => dispatch(
    sendTransactionAction(plan),
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(SendBitcoinConfirm);
