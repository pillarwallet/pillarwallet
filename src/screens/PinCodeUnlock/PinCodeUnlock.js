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
import { AppState } from 'react-native';
import { connect } from 'react-redux';
import { DEFAULT_PIN } from 'react-native-dotenv';
import type { NavigationScreenProp } from 'react-navigation';

import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import { ALLOWED_PIN_ATTEMPTS, PIN_LOCK_MULTIPLIER } from 'configs/walletConfig';
import { DECRYPTING, INVALID_PASSWORD } from 'constants/walletConstants';
import { FORGOT_PIN } from 'constants/navigationConstants';
import { loginAction } from 'actions/authActions';
import { Container } from 'components/Layout';
import Loader from 'components/Loader';
import Header from 'components/Header';
import ErrorMessage from 'components/ErrorMessage';
import PinCode from 'components/PinCode';
import { addAppStateChangeListener, removeAppStateChangeListener } from 'utils/common';
import {
  getKeychainDataObject,
  getPrivateKeyFromKeychainData,
  shouldUpdateKeychainObject,
  type KeyChainData,
} from 'utils/keychain';


const ACTIVE_APP_STATE = 'active';
const BACKGROUND_APP_STATE = 'background';

type Props = {
  loginWithPin: (pin: string, callback: ?Function) => void,
  loginWithPrivateKey: (privateKey: string, callback: ?Function) => void,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
  useBiometrics: ?boolean,
};

type State = {
  waitingTime: number,
  biometricsShown: boolean,
  lastAppState: string,
  showPin: boolean,
};

class PinCodeUnlock extends React.Component<Props, State> {
  errorMessage: string;
  onLoginSuccess: ?Function;
  interval: IntervalID;
  state = {
    waitingTime: 0,
    biometricsShown: false,
    lastAppState: AppState.currentState,
    showPin: false,
  };

  constructor(props) {
    super(props);
    const { navigation } = this.props;
    this.errorMessage = navigation.getParam('errorMessage', '');
    this.onLoginSuccess = navigation.getParam('onLoginSuccess', null);

    if (navigation.getParam('forcePin')) {
      this.state.showPin = true;
    }
  }

  componentDidMount() {
    addAppStateChangeListener(this.handleAppStateChange);
    const { navigation } = this.props;
    const { lastAppState } = this.state;

    if (navigation.getParam('forcePin')) return;

    if (!this.errorMessage && DEFAULT_PIN) {
      this.handlePinSubmit(DEFAULT_PIN);
    }

    if (!this.errorMessage && lastAppState !== BACKGROUND_APP_STATE) {
      this.triggerAuthentication();
    }
    this.handleLocking(true);
  }

  componentWillUnmount() {
    removeAppStateChangeListener(this.handleAppStateChange);
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  triggerAuthentication = () => {
    const { useBiometrics } = this.props;
    if (useBiometrics) {
      this.showBiometricLogin();
    } else {
      getKeychainDataObject().then(data => {
        this.loginWithPrivateKey(data);
      }).catch(this.requirePinLogin);
    }
  }

  loginWithPrivateKey = (data: KeyChainData) => {
    const { loginWithPrivateKey } = this.props;
    // migrate older users
    if (shouldUpdateKeychainObject(data)) {
      this.requirePinLogin();
      return;
    }
    const privateKey = getPrivateKeyFromKeychainData(data);
    if (privateKey) {
      removeAppStateChangeListener(this.handleAppStateChange);
      loginWithPrivateKey(privateKey, this.onLoginSuccess);
    }
  };

  handleAppStateChange = (nextAppState: string) => {
    const { lastAppState } = this.state;
    if (nextAppState === ACTIVE_APP_STATE
      && lastAppState === BACKGROUND_APP_STATE
      && !this.errorMessage
    ) {
      this.triggerAuthentication();
    }
    this.setState({ lastAppState: nextAppState });
  };

  requirePinLogin = () => {
    this.setState({ showPin: true });
  };

  showBiometricLogin() {
    const { biometricsShown } = this.state;

    if (biometricsShown) {
      this.requirePinLogin();
      return;
    }

    this.setState({ biometricsShown: true }, () => {
      getKeychainDataObject()
        .then(data => {
          this.setState({ biometricsShown: false });
          this.loginWithPrivateKey(data);
        })
        .catch(() => this.setState({ biometricsShown: false }));
    });
  }

  getWaitingTime = (isNewMount: boolean): number => {
    const { pinAttemptsCount, lastPinAttempt } = this.props.wallet;
    const lastAttemptSeconds = (Date.now() - lastPinAttempt) / 1000;
    const nextInterval = pinAttemptsCount * PIN_LOCK_MULTIPLIER;
    if (pinAttemptsCount > ALLOWED_PIN_ATTEMPTS) {
      if (isNewMount && lastAttemptSeconds < nextInterval) {
        return nextInterval - lastAttemptSeconds;
      }
      return nextInterval;
    }
    return 0;
  };

  handleLocking = (isNewMount: boolean) => {
    if (this.interval) {
      clearInterval(this.interval);
    }
    const waitingTime = this.getWaitingTime(isNewMount);
    if (waitingTime > 0) {
      this.setState({ waitingTime }, () => {
        this.interval = setInterval(() => {
          if (this.state.waitingTime > 0) {
            this.setState((prev: State) => ({ waitingTime: prev.waitingTime - 1 }));
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
    const { loginWithPin } = this.props;
    loginWithPin(pin, this.onLoginSuccess);
    this.handleLocking(false);
  };

  handleForgotPasscode = () => {
    this.props.navigation.navigate(FORGOT_PIN);
  };

  render() {
    const { walletState } = this.props.wallet;
    const { waitingTime, showPin } = this.state;
    const pinError = walletState === INVALID_PASSWORD ? 'Invalid pincode' : (this.errorMessage || null);
    const showError = pinError ? <ErrorMessage>{pinError}</ErrorMessage> : null;

    if (walletState === DECRYPTING) {
      return (
        <Container center>
          <Loader />
        </Container>
      );
    }
    if (showPin) {
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

    return null;
  }
}

const mapStateToProps = ({
  wallet,
  appSettings: { data: { useBiometrics = false } },
}: RootReducerState): $Shape<Props> => ({
  wallet,
  useBiometrics,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  loginWithPin: (pin: string, callback: ?Function) => dispatch(
    loginAction(pin, null, callback),
  ),
  loginWithPrivateKey: (privateKey: string, callback: ?Function) => dispatch(loginAction(null, privateKey, callback)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PinCodeUnlock);
