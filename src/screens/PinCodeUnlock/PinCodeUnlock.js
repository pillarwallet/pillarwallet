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
import { AppState, Dimensions } from 'react-native';
import { connect } from 'react-redux';
import type { NativeStackNavigationProp as NavigationScreenProp } from '@react-navigation/native-stack';
import t from 'translations/translate';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

// actions
import { loginAction } from 'actions/authActions';
import { initArchanovaSdkWithPrivateKeyOrPinAction } from 'actions/smartWalletActions';
import { switchAccountAction } from 'actions/accountsActions';
import { removePrivateKeyFromMemoryAction } from 'actions/walletActions';

// configs
import { getEnv } from 'configs/envConfig';
import { LOCK_TIME } from 'configs/walletConfig';

// constants
import { FORGOT_PIN } from 'constants/navigationConstants';
import { UPDATE_PIN_ATTEMPTS, TODAY_FAILED_ATTEMPTS } from 'constants/walletConstants';

// components
import { Container } from 'components/legacy/Layout';
import Header from 'components/Header';
import ErrorMessage from 'components/ErrorMessage';
import PinCode from 'components/PinCode';
import { Spacing } from 'components/layout/Layout';

// utils
import { addAppStateChangeListener } from 'utils/common';
import {
  getKeychainDataObject,
  getPrivateKeyFromKeychainData,
  shouldUpdateKeychainObject,
  type KeyChainData,
} from 'utils/keychain';

// Service
import { getCurrentTime } from 'services/ntpSync';
import Storage from 'services/storage';

// types
import type { InitArchanovaProps } from 'models/ArchanovaWalletAccount';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { OnValidPinCallback } from 'models/Wallet';
import type { Route } from '@react-navigation/native';

const ACTIVE_APP_STATE = 'active';
const BACKGROUND_APP_STATE = 'background';

const storage = Storage.getInstance('db');

type HandleUnlockActionProps = {
  pin?: string,
  privateKey?: string,
  defaultAction: () => void,
};

type Props = {
  loginWithPin: (pin: string, callback: ?OnValidPinCallback, useBiometrics: ?boolean) => void,
  loginWithPrivateKey: (privateKey: string, callback: ?OnValidPinCallback) => void,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
  route: Route,
  useBiometrics: ?boolean,
  initSmartWalletSdkWithPrivateKeyOrPin: (initProps: InitArchanovaProps) => void,
  switchAccount: (accountId: string) => void,
  isAuthorizing: boolean,
  removePrivateKeyFromMemory: Function,
  updateAttempts: (payload: Object) => void,
  todayAttempts: (payload: Object) => void,
};

type State = {
  waitingTime: number,
  biometricsShown: boolean,
  lastAppState: ?string,
  showPin: boolean,
  showErrorMessage: boolean,
  isOnline: boolean,
  isLoading: boolean,
};

const { height } = Dimensions.get('window');
class PinCodeUnlock extends React.Component<Props, State> {
  errorMessage: string;
  appStateSubscriptions: any;
  removeNetInfoEventListener: NetInfoSubscription;
  onLoginSuccess: ?OnValidPinCallback;
  interval: IntervalID;
  timeout: any;
  state = {
    isOnline: false,
    isLoading: false,
    waitingTime: 0,
    biometricsShown: false,
    lastAppState: AppState.currentState,
    showPin: false,
    showErrorMessage: false,
  };

  constructor(props) {
    super(props);
    const { useBiometrics, route } = this.props;
    this.errorMessage = route?.params?.errorMessage || '';
    this.onLoginSuccess = route?.params?.onLoginSuccess || null;
    const forcePinParam = route?.params?.forcePin;
    const omitPinParam = route?.params?.omitPin;
    this.timeout = null;

    if ((!useBiometrics || forcePinParam) && !omitPinParam) {
      this.state.showPin = true;
    }
  }

  componentDidMount() {
    this.appStateSubscriptions = addAppStateChangeListener(this.handleAppStateChange);
    const { route, wallet, removePrivateKeyFromMemory } = this.props;
    if (wallet?.data?.privateKey) removePrivateKeyFromMemory();

    const { lastAppState } = this.state;

    if (route?.params?.forcePin) return;

    (async () => {
      await NetInfo.fetch()
        .then(async (netInfoState) => {
          this.setState({ isOnline: netInfoState.isInternetReachable });
        })
        .catch(() => null);
    })();

    this.removeNetInfoEventListener = NetInfo.addEventListener(this.handleConnectivityChange);

    if (route?.params?.omitPin) {
      getKeychainDataObject()
        .then((data) => {
          this.loginWithPrivateKey(data);
        })
        .catch(() => {
          this.triggerAuthentication();
        });
      return;
    }

    if (!this.errorMessage && getEnv().DEFAULT_PIN) {
      this.handlePinSubmit(getEnv().DEFAULT_PIN);
    }

    if (!this.errorMessage && lastAppState !== BACKGROUND_APP_STATE) {
      this.triggerAuthentication();
    }
  }

  componentWillUnmount() {
    if (this.appStateSubscriptions) this.appStateSubscriptions.remove();
    if (this.timeout) clearTimeout(this.timeout);
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.removeNetInfoEventListener) {
      this.removeNetInfoEventListener();
      delete this.removeNetInfoEventListener;
    }
  }

  triggerAuthentication = () => {
    const { useBiometrics } = this.props;
    if (useBiometrics) {
      this.showBiometricLogin();
    } else {
      this.setState({ showPin: true });
    }
  };

  handleConnectivityChange = async (state: NetInfoState) => {
    if (this.state.isOnline === state.isInternetReachable) return;
    this.setState({ isOnline: state.isInternetReachable }, async () => {
      if (state.isInternetReachable) {
        const { updateAttempts, todayAttempts } = this.props;

        this.setState({ isLoading: true });

        const currentTime = await getCurrentTime();
        if (!currentTime) return;

        const { failedAttempts = {}, pinAttempt = {} } = await storage.get('pinAttempt');
        const { numberOfFailedAttempts = 0, date = currentTime } = failedAttempts;
        const { pinAttemptsCount = 0 } = pinAttempt;

        if (new Date(date).toDateString() === currentTime?.toDateString()) {
          updateAttempts({
            pinAttemptsCount,
          });
          todayAttempts({
            failedAttempts: {
              numberOfFailedAttempts,
              date: new Date(date),
            },
          });
        } else {
          // Note: Called when the app is opened for the first time on a new day
          updateAttempts({
            pinAttemptsCount: 0,
          });
          todayAttempts({
            failedAttempts: {
              numberOfFailedAttempts: 0,
              date: new Date(currentTime),
            },
          });
        }
        await this.handleLocking();
      }
    });
  };

  handleUnlockAction = async ({ pin, privateKey, defaultAction }: HandleUnlockActionProps) => {
    const { navigation, route, switchAccount, initSmartWalletSdkWithPrivateKeyOrPin } = this.props;
    const shouldInitSmartWalletSdk = route?.params?.initSmartWalletSdk;
    const accountIdToSwitchTo = route?.params?.switchToAcc;

    if (shouldInitSmartWalletSdk) {
      await initSmartWalletSdkWithPrivateKeyOrPin({ privateKey, pin });
      if (accountIdToSwitchTo) switchAccount(accountIdToSwitchTo);
      navigation.goBack();
    } else {
      defaultAction();
    }
  };

  loginWithPrivateKey = (data: KeyChainData) => {
    const { loginWithPrivateKey } = this.props;
    // migrate older users
    if (shouldUpdateKeychainObject(data)) {
      this.requirePinLogin();
      return;
    }
    const privateKey = getPrivateKeyFromKeychainData(data);
    if (privateKey) {
      if (this.appStateSubscriptions) this.appStateSubscriptions.remove();
      this.handleUnlockAction({
        privateKey,
        defaultAction: () => loginWithPrivateKey(privateKey, this.onLoginSuccess),
      });
    }
  };

  handleAppStateChange = async (nextAppState: string) => {
    const { lastAppState } = this.state;

    if (nextAppState === ACTIVE_APP_STATE && lastAppState === BACKGROUND_APP_STATE && !this.errorMessage) {
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
        .then((data) => {
          this.setState({ biometricsShown: false });
          this.loginWithPrivateKey(data);
        })
        .catch(() => this.setState({ biometricsShown: false }));
    });
  }

  getWaitingTime = async (): Promise<number | null> => {
    const {
      pinAttemptsCount,
      failedAttempts: { numberOfFailedAttempts, date },
    } = this.props.wallet;

    const lastPinAttemptTime = new Date(date);
    const currentTime = await getCurrentTime();
    const nextInterval = new Date(lastPinAttemptTime?.getTime() + (LOCK_TIME * numberOfFailedAttempts * 1000));

    if (!currentTime) return null;

    if (pinAttemptsCount === 0 && currentTime < nextInterval) {
      const pendingTime = (nextInterval - currentTime) / 1000;
      return parseInt(pendingTime, 10);
    }

    return 0;
  };

  handleLocking = async () => {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.setState({ isLoading: true });
    const waitingTime = await this.getWaitingTime();
    if (waitingTime === null) return;
    if (waitingTime > 0) {
      this.setState({ waitingTime, isLoading: false }, () => {
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
      this.setState({ waitingTime: 0, isLoading: false });
    }
  };

  handlePinSubmit = async (pin: string) => {
    const { loginWithPin } = this.props;
    await this.handleUnlockAction({
      pin,
      defaultAction: () => loginWithPin(pin, this.onLoginSuccess),
    });
    this.timeout = setTimeout(async () => {
      this.setState({ showErrorMessage: true });
      await this.handleLocking();
    }, 1200);
  };

  handleForgotPasscode = () => {
    this.props.navigation.navigate(FORGOT_PIN);
  };

  formattedHour = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time - (minutes * 60);
    return `${minutes?.toFixed(0)}:${seconds?.toFixed(0)}`;
  };

  render() {
    const {
      wallet: { errorMessage: walletErrorMessage },
      isAuthorizing,
    } = this.props;
    const { showErrorMessage, isOnline, isLoading } = this.state;
    const { waitingTime, showPin } = this.state;
    const pinError = walletErrorMessage || this.errorMessage || null;
    const showError =
      pinError && showErrorMessage ? (
        <ErrorMessage
          textStyle={{ fontSize: 24 }}
          testID={`${TAG}-error-pin_error`}
          // eslint-disable-next-line i18next/no-literal-string
          accessibilityLabel={`${TAG}-error-pin_error`}
        >
          {pinError}
        </ErrorMessage>
      ) : null;

    if (showPin) {
      return (
        <Container inset={{ bottom: 'always' }}>
          <Header centerTitle title={t('auth:enterPincode')} />
          <Spacing h={height * 0.1} />
          {showError}
          {waitingTime > 0 && (
            // eslint-disable-next-line i18next/no-literal-string
            <ErrorMessage testID={`${TAG}-error-max_attempts`} accessibilityLabel={`${TAG}-error-max_attempts`}>
              {t('auth:error.tooManyAttemptsTryAgainError', { waitDuration: this.formattedHour(waitingTime) })}
            </ErrorMessage>
          )}
          {waitingTime <= 0 && (
            <PinCode
              onPinEntered={this.handlePinSubmit}
              onForgotPin={this.handleForgotPasscode}
              onPinChanged={() => this.setState({ showErrorMessage: false })}
              pinError={!!pinError && showErrorMessage}
              isLoading={isAuthorizing || !isOnline || isLoading}
              testIdTag={TAG}
              customStyle={{ flexGrow: 0.5 }}
            />
          )}
        </Container>
      );
    }

    return <Container />;
  }
}

const mapStateToProps = ({
  wallet,
  appSettings: {
    data: { useBiometrics },
  },
  session: {
    data: { isAuthorizing },
  },
}: RootReducerState): $Shape<Props> => ({
  wallet,
  useBiometrics,
  isAuthorizing,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  loginWithPin: (pin: string, callback: ?OnValidPinCallback) => dispatch(loginAction(pin, null, callback)),
  loginWithPrivateKey: (privateKey: string, callback: ?OnValidPinCallback) =>
    dispatch(loginAction(null, privateKey, callback)),
  initSmartWalletSdkWithPrivateKeyOrPin: (initProps: InitArchanovaProps) =>
    dispatch(initArchanovaSdkWithPrivateKeyOrPinAction(initProps)),
  switchAccount: (accountId: string) => dispatch(switchAccountAction(accountId)),
  removePrivateKeyFromMemory: () => dispatch(removePrivateKeyFromMemoryAction()),
  updateAttempts: (payload) =>
    dispatch({
      type: UPDATE_PIN_ATTEMPTS,
      payload,
    }),
  todayAttempts: (payload) => dispatch({ type: TODAY_FAILED_ATTEMPTS, payload }),
});

export default connect(mapStateToProps, mapDispatchToProps)(PinCodeUnlock);

const TAG = 'PinCodeUnlock';
