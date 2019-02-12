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
import { Container, Wrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import PinCode from 'components/PinCode';
import ErrorMessage from 'components/ErrorMessage';
import Header from 'components/Header';
import { setPinForNewWalletAction } from 'actions/walletActions';
import { validatePin } from 'utils/validators';

type Props = {
  setPinForNewWallet: (pin: string) => Function,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
};

type State = {
  error: string,
};

class SetWalletPinCode extends React.Component<Props, State> {
  state = {
    error: '',
  };

  handlePinSubmit = (pin: string) => {
    const validationError = validatePin(pin);
    if (validationError) {
      this.setState({
        error: validationError,
      });
      return;
    }

    this.props.setPinForNewWallet(pin);
  };

  handlePinChange = () => {
    this.setState({
      error: '',
    });
  };

  render() {
    const { error } = this.state;
    const { wallet, navigation } = this.props;
    const { onboarding } = wallet;
    const { apiUser } = onboarding;
    const returningUser = navigation.getParam('returningUser', false);
    // not to show "hello, undefined" on back action.
    const titleForNewUser = apiUser.username ? `hello, ${apiUser.username}` : 'hello';
    const title = returningUser ? 'set pincode' : titleForNewUser;

    return (
      <Container>
        {!!error && <ErrorMessage>{error}</ErrorMessage>}
        <Header
          title={title}
          onBack={() => this.props.navigation.goBack(null)}
        />
        <Wrapper regularPadding style={{ justifyContent: 'space-between', flex: 1 }}>
          <Paragraph light small style={{ marginBottom: 50, marginTop: 10 }}>
            {returningUser
              ? 'It will be used to access the wallet and confirm transactions.'
              : 'Set your pin-code. It will be used to access the wallet and confirm transactions.'
            }
          </Paragraph>
          <PinCode
            onPinEntered={this.handlePinSubmit}
            onPinChanged={this.handlePinChange}
            pageInstructions="Setup your Pincode"
            showForgotButton={false}
            pinError={!!error}
            flex={false}
          />
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  setPinForNewWallet: (pin) => {
    dispatch(setPinForNewWalletAction(pin));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SetWalletPinCode);
