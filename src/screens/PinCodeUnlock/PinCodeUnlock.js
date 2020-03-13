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
import get from 'lodash.get';
import type { NavigationScreenProp } from 'react-navigation';

import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import { ALLOWED_PIN_ATTEMPTS, PIN_LOCK_MULTIPLIER } from 'configs/walletConfig';
import { PRE_KEY_THRESHOLD } from 'configs/connectionKeysConfig';
import { DECRYPTING, INVALID_PASSWORD, GENERATING_CONNECTIONS } from 'constants/walletConstants';
import { FORGOT_PIN } from 'constants/navigationConstants';
import { loginAction } from 'actions/authActions';
import { Container } from 'components/Layout';
import Loader from 'components/Loader';
import Header from 'components/Header';
import ErrorMessage from 'components/ErrorMessage';
import PinCode from 'components/PinCode';
import Toast from 'components/Toast';
import { addAppStateChangeListener, removeAppStateChangeListener } from 'utils/common';
import { getKeychainDataObject, getSupportedBiometryType } from 'utils/keychain';
import { getBiometryType } from 'utils/settings';

const ACTIVE_APP_STATE = 'active';
const BACKGROUND_APP_STATE = 'background';

type Props = {
  loginWithPin: (pin: string, callback: ?Function, updateKeychain: boolean) => void,
  loginWithPrivateKey: (privateKey: string, callback: ?Function) => void,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
  useBiometrics: ?boolean,
  connectionKeyPairs: Object,
}

type State = {
  waitingTime: number,
  biometricsShown: boolean,
  updateKeychain: boolean,
  lastAppState: string,
  supportedBiometryType: string,
};

class PinCodeUnlock extends React.Component<Props, State> {
  errorMessage: string;
  onLoginSuccess: ?Function;
  interval: IntervalID;
  state = {
    waitingTime: 0,
    biometricsShown: false,
    updateKeychain: false,
    lastAppState: AppState.currentState,
    supportedBiometryType: '',
  };

  constructor(props) {
    super(props);
    const { navigation } = this.props;
    this.errorMessage = navigation.getParam('errorMessage', '');
    this.onLoginSuccess = navigation.getParam('onLoginSuccess', null);
  }

  componentDidMount() {
    addAppStateChangeListener(this.handleAppStateChange);
    const { useBiometrics } = this.props;
    const { lastAppState } = this.state;

    if (!this.errorMessage && DEFAULT_PIN) {
      this.handlePinSubmit(DEFAULT_PIN);
    }

    if (useBiometrics
      && !this.errorMessage
      && lastAppState !== BACKGROUND_APP_STATE) {
      getSupportedBiometryType(biometryType => {
        this.setState({ supportedBiometryType: getBiometryType(biometryType) });
        this.showBiometricLogin();
      });
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
    const { lastAppState } = this.state;
    if (nextAppState === ACTIVE_APP_STATE
      && lastAppState === BACKGROUND_APP_STATE
      && useBiometrics
      && !this.errorMessage) {
      this.showBiometricLogin();
    }
    this.setState({ lastAppState: nextAppState });
  };

  showBiometricLogin() {
    const { loginWithPrivateKey, connectionKeyPairs: { data: connKeys, lastConnectionKeyIndex } } = this.props;
    const { biometricsShown, supportedBiometryType } = this.state;

    if (biometricsShown || connKeys.length <= PRE_KEY_THRESHOLD || lastConnectionKeyIndex === -1) {
      Toast.show({
        message: 'Pin code is needed to finish setting up connections',
        type: 'warning',
        title: `${supportedBiometryType} could not be used`,
        autoClose: false,
      });
      return;
    }

    this.setState({ biometricsShown: true }, () => {
      getKeychainDataObject()
        .then(data => {
          this.setState({ biometricsShown: false });
          if (!data || !Object.keys(data).length) {
            this.setState({ updateKeychain: true });
            return;
          }
          const privateKey = get(data, 'privateKey', null);
          if (privateKey) {
            removeAppStateChangeListener(this.handleAppStateChange);
            loginWithPrivateKey(privateKey, this.onLoginSuccess);
          }
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
    const { updateKeychain } = this.state;
    loginWithPin(pin, this.onLoginSuccess, updateKeychain);
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
          <Loader />
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
}: RootReducerState): $Shape<Props> => ({
  wallet,
  useBiometrics,
  connectionKeyPairs,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  loginWithPin: (pin: string, callback: ?Function, updateKeychain) => dispatch(
    loginAction(pin, null, callback, updateKeychain),
  ),
  loginWithPrivateKey: (privateKey: string, callback: ?Function) => dispatch(loginAction(null, privateKey, callback)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PinCodeUnlock);
