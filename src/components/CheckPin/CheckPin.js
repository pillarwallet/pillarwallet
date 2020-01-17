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
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import get from 'lodash.get';

import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import { DECRYPTING, INVALID_PASSWORD, GENERATING_CONNECTIONS } from 'constants/walletConstants';
import { checkAuthAction } from 'actions/authActions';
import { Container, Wrapper } from 'components/Layout';
import Loader from 'components/Loader';
import ErrorMessage from 'components/ErrorMessage';
import PinCode from 'components/PinCode';
import { addAppStateChangeListener, removeAppStateChangeListener } from 'utils/common';
import { getKeychainDataObject } from 'utils/keychain';

type Props = {
  checkPin: (pin: string, onValidPin: Function, options: Object) => void,
  checkPrivateKey: (privateKey: string, onValidPin: Function) => void,
  wallet: Object,
  revealMnemonic: boolean,
  onPinValid: Function,
  isChecking: boolean,
  title?: string,
  useBiometrics: ?boolean,
}

type State = {
  biometricsShown: boolean,
  lastAppState: string,
}

const CheckPinWrapper = styled(Wrapper)`
  margin-top: auto;
  height: 100%;
  flex: 1;
`;

const ACTIVE_APP_STATE = 'active';
const BACKGROUND_APP_STATE = 'background';

class CheckPin extends React.Component<Props, State> {
  static defaultProps = {
    revealMnemonic: false,
  };
  state = {
    biometricsShown: false,
    lastAppState: AppState.currentState,
  };

  componentDidMount() {
    addAppStateChangeListener(this.handleAppStateChange);
    const { useBiometrics, revealMnemonic } = this.props;
    const { lastAppState } = this.state;
    if (useBiometrics
      && !revealMnemonic
      && lastAppState !== BACKGROUND_APP_STATE) {
      this.showBiometricLogin();
    }
  }

  handleAppStateChange = (nextAppState: string) => {
    const { useBiometrics, revealMnemonic } = this.props;
    const { lastAppState } = this.state;
    if (nextAppState === ACTIVE_APP_STATE
      && lastAppState === BACKGROUND_APP_STATE
      && useBiometrics
      && !revealMnemonic) {
      this.showBiometricLogin();
    }
    this.setState({ lastAppState: nextAppState });
  };

  showBiometricLogin() {
    const { checkPrivateKey, onPinValid } = this.props;
    const { biometricsShown } = this.state;
    if (biometricsShown) return;
    this.setState({ biometricsShown: true }, () => {
      getKeychainDataObject()
        .then(data => {
          this.setState({ biometricsShown: false });
          const privateKey = get(data, 'privateKey', null);
          if (privateKey) {
            removeAppStateChangeListener(this.handleAppStateChange);
            checkPrivateKey(privateKey, onPinValid);
          }
        })
        .catch(() => this.setState({ biometricsShown: false }));
    });
  }

  handlePinSubmit = (pin: string) => {
    const {
      checkPin,
      onPinValid,
      revealMnemonic,
    } = this.props;
    const options = {
      mnemonic: revealMnemonic,
    };
    checkPin(pin, onPinValid, options);
  };

  getPinError = (walletState: string) => {
    switch (walletState) {
      case INVALID_PASSWORD:
        return 'Invalid pincode';
      default:
        return null;
    }
  };

  render() {
    const { wallet: { walletState }, isChecking } = this.props;
    const pinError = this.getPinError(walletState);
    const showError = pinError ? <ErrorMessage>{pinError}</ErrorMessage> : null;

    if (walletState === DECRYPTING || isChecking || walletState === GENERATING_CONNECTIONS) {
      return (
        <Container style={{ flex: 1, width: '100%' }} center color="transparent">
          <Loader messages={['Checking']} />
        </Container>
      );
    }

    return (
      <CheckPinWrapper>
        {showError}
        <PinCode
          onPinEntered={this.handlePinSubmit}
          pageInstructions=""
          showForgotButton={false}
          pinError={!!pinError}
        />
      </CheckPinWrapper>
    );
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
  checkPin: (pin: string, onValidPin: Function, options: Object) => {
    dispatch(checkAuthAction(pin, null, onValidPin, options));
  },
  checkPrivateKey: (privateKey: string, onValidPin: Function) => {
    dispatch(checkAuthAction(null, privateKey, onValidPin));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(CheckPin);
