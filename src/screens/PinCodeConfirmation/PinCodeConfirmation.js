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
import { Container, Wrapper } from 'components/Layout';
import type { NavigationScreenProp } from 'react-navigation';
import Header from 'components/Header';
import PinCode from 'components/PinCode';
import ErrorMessage from 'components/ErrorMessage';
import { confirmPinForNewWalletAction } from 'actions/walletActions';
import { validatePin } from 'utils/validators';
import { PIN_CODE_CONFIRMATION } from 'constants/navigationConstants';

type Props = {
  confirmPinForNewWallet: (pin: string) => Function,
  navigation: NavigationScreenProp<*>,
  wallet: Object,
};

type State = {
  errorMessage: string,
};

class PinCodeConfirmation extends React.Component<Props, State> {
  state = {
    errorMessage: '',
  };

  constructor(props) {
    super(props);
    this.props.navigation.state.key = PIN_CODE_CONFIRMATION;
  }

  handlePinSubmit = (pin: string) => {
    const { onboarding: wallet } = this.props.wallet;
    const previousPin = wallet.pin;
    const validationError = validatePin(pin, previousPin);

    if (validationError) {
      this.setState({
        errorMessage: validationError,
      });
      return;
    }

    this.props.confirmPinForNewWallet(pin);
  };

  handlePinChange = () => {
    this.setState({
      errorMessage: '',
    });
  };

  render() {
    return (
      <Container>
        {!!this.state.errorMessage && <ErrorMessage>{this.state.errorMessage}</ErrorMessage>}
        <Header title="confirm pincode" onBack={() => this.props.navigation.goBack(null)} />
        <Wrapper regularPadding flex={1}>
          <PinCode
            onPinEntered={this.handlePinSubmit}
            onPinChanged={this.handlePinChange}
            pageInstructions="Confirm your Pincode"
            showForgotButton={false}
            pinError={!!this.state.errorMessage}
            flex={false}
            customStyle={{ marginTop: 100 }}
          />
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  confirmPinForNewWallet: (pin) => {
    dispatch(confirmPinForNewWalletAction(pin));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(PinCodeConfirmation);
