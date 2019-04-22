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
import TouchID from 'react-native-touch-id';
import { DECRYPTING, INVALID_PASSWORD, GENERATING_CONNECTIONS } from 'constants/walletConstants';
import { FORGOT_PIN } from 'constants/navigationConstants';
import { loginAction } from 'actions/authActions';
import { Container } from 'components/Layout';
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import Header from 'components/Header';
import ErrorMessage from 'components/ErrorMessage';
import PinCode from 'components/PinCode';
import { addAppStateChangeListener, removeAppStateChangeListener } from 'utils/common';

const ACTIVE_APP_STATE = 'active';

type Props = {
  login: (pin: string, touchID?: boolean, callback?: Function) => Function,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
  useBiometrics: ?boolean,
  connectionKeyPairs: Object,
}

class PinCodeUnlock extends React.Component<Props> {
  errorMessage: string;
  onLoginSuccess: ?Function;

  constructor(props) {
    super(props);
    const { navigation } = this.props;
    this.errorMessage = navigation.getParam('errorMessage', '');
    this.onLoginSuccess = navigation.getParam('onLoginSuccess', null);
  }

  componentDidMount() {
    addAppStateChangeListener(this.handleAppStateChange);
    const { useBiometrics, connectionKeyPairs: { data, lastConnectionKeyIndex } } = this.props;
    if (useBiometrics && !this.errorMessage && data.length > 20 && lastConnectionKeyIndex > -1) {
      this.showBiometricLogin();
    }
  }

  componentWillUnmount() {
    removeAppStateChangeListener(this.handleAppStateChange);
  }

  handleAppStateChange = (nextAppState: string) => {
    const { useBiometrics } = this.props;
    if (nextAppState === ACTIVE_APP_STATE && useBiometrics && !this.errorMessage) {
      this.showBiometricLogin();
    }
  };

  showBiometricLogin() {
    const { login } = this.props;
    TouchID.authenticate('Biometric login')
      .then(() => {
        removeAppStateChangeListener(this.handleAppStateChange);
        login('', true);
      })
      .catch(() => null);
  }

  handlePinSubmit = (pin: string) => {
    const { login } = this.props;
    login(pin, false, this.onLoginSuccess || undefined);
  };

  handleForgotPasscode = () => {
    this.props.navigation.navigate(FORGOT_PIN);
  };

  render() {
    const { walletState } = this.props.wallet;
    const pinError = walletState === INVALID_PASSWORD ? 'Invalid pincode' : (this.errorMessage || null);
    const showError = pinError ? <ErrorMessage>{pinError}</ErrorMessage> : null;

    if (walletState === DECRYPTING || walletState === GENERATING_CONNECTIONS) {
      return (
        <Container center>
          <BaseText style={{ marginBottom: 20 }}>{walletState}</BaseText>
          <Spinner />
        </Container>
      );
    }

    return (
      <Container>
        <Header centerTitle title="enter pincode" />
        {showError}
        <PinCode
          onPinEntered={this.handlePinSubmit}
          pageInstructions=""
          onForgotPin={this.handleForgotPasscode}
          pinError={!!pinError}
        />
      </Container>
    );
  }
}

const mapStateToProps = ({
  wallet,
  appSettings: { data: { useBiometrics = false } },
  connectionKeyPairs,
}) => ({
  wallet,
  useBiometrics,
  connectionKeyPairs,
});

const mapDispatchToProps = (dispatch: Function) => ({
  login: (pin: string, touchID?: boolean, callback?: Function) => dispatch(loginAction(pin, touchID, callback)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PinCodeUnlock);
