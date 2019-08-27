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
import { DEFAULT_PIN } from 'react-native-dotenv';

const ACTIVE_APP_STATE = 'active';

type Props = {
  login: (pin: string, touchID?: boolean, callback?: Function) => Function,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
  useBiometrics: ?boolean,
  connectionKeyPairs: Object,
  smartWalletFeatureEnabled: boolean,
}

type State = {
  waitingTime: number,
};

class PinCodeUnlock extends React.Component<Props, State> {
  errorMessage: string;
  onLoginSuccess: ?Function;
  interval: IntervalID;
  state = {
    waitingTime: 0,
  };

  constructor(props) {
    super(props);
    const { navigation } = this.props;
    this.errorMessage = navigation.getParam('errorMessage', '');
    this.onLoginSuccess = navigation.getParam('onLoginSuccess', null);
  }

  componentDidMount() {
    addAppStateChangeListener(this.handleAppStateChange);
    const { useBiometrics, smartWalletFeatureEnabled } = this.props;

    if (!this.errorMessage && DEFAULT_PIN) {
      this.handlePinSubmit(DEFAULT_PIN);
    }

    if (useBiometrics
      && !smartWalletFeatureEnabled
      && !this.errorMessage) {
      this.showBiometricLogin();
    }

    this.handleLocking(true);
  }

  componentWillUnmount() {
    removeAppStateChangeListener(this.handleAppStateChange);
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  handleAppStateChange = (nextAppState: string) => {
    const { useBiometrics } = this.props;
    if (nextAppState === ACTIVE_APP_STATE && useBiometrics && !this.errorMessage) {
      this.showBiometricLogin();
    }
  };

  showBiometricLogin() {
    const { login, connectionKeyPairs: { data, lastConnectionKeyIndex } } = this.props;
    if (data.length > 20 && lastConnectionKeyIndex > -1) {
      TouchID.authenticate('Biometric login')
        .then(() => {
          removeAppStateChangeListener(this.handleAppStateChange);
          login('', true);
        })
        .catch(() => null);
    }
  }

  getWaitingTime = (onMount) => {
    const { pinAttemptsCount, lastPinAttempt } = this.props.wallet;
    const lastAttemptSeconds = (Date.now() - lastPinAttempt) / 1000;
    const nextInterval = pinAttemptsCount * 2;
    if (pinAttemptsCount > 5) {
      if (onMount && lastAttemptSeconds < nextInterval) {
        return nextInterval - lastAttemptSeconds;
      }
      return nextInterval;
    }
    return 0;
  };

  handleLocking = (onMount) => {
    if (this.interval) {
      clearInterval(this.interval);
    }
    const waitingTime = this.getWaitingTime(onMount);
    if (waitingTime > 0) {
      this.setState({ waitingTime }, () => {
        this.interval = setInterval(() => {
          if (this.state.waitingTime > 0) {
            this.setState((prev: State) => ({ waitingTime: prev.state.waitingTime - 1 }));
          } else {
            this.setState({ waitingTime: 0 });
            clearInterval(this.interval);
          }
        }, 1000);
      });
    } else {
      this.setState({ waitingTime: 0 });
    }
  };

  handlePinSubmit = (pin: string) => {
    const { login } = this.props;
    login(pin, false, this.onLoginSuccess || undefined);
    this.handleLocking(false);
  };

  handleForgotPasscode = () => {
    this.props.navigation.navigate(FORGOT_PIN);
  };

  render() {
    const { walletState } = this.props.wallet;
    const { waitingTime } = this.state;
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
        <Header centerTitle title="Enter pincode" />
        {showError}
        {waitingTime > 0 &&
          <ErrorMessage>Too many attempts, please try again in {waitingTime.toFixed(0)} seconds.</ErrorMessage>
        }
        {waitingTime <= 0 &&
          <PinCode
            onPinEntered={this.handlePinSubmit}
            pageInstructions=""
            onForgotPin={this.handleForgotPasscode}
            pinError={!!pinError}
          />
        }
      </Container>
    );
  }
}

const mapStateToProps = ({
  wallet,
  appSettings: { data: { useBiometrics = false } },
  connectionKeyPairs,
  featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
}) => ({
  wallet,
  useBiometrics,
  connectionKeyPairs,
  smartWalletFeatureEnabled,
});

const mapDispatchToProps = (dispatch: Function) => ({
  login: (pin: string, touchID?: boolean, callback?: Function) => dispatch(loginAction(pin, touchID, callback)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PinCodeUnlock);
