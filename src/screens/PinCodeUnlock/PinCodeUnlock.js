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
import { FORGOT_PIN } from 'constants/navigationConstants';
import { loginAction } from 'actions/authActions';
import { addAppStateChangeListener, removeAppStateChangeListener } from 'utils/common';
import Scene from './scene';

const ACTIVE_APP_STATE = 'active';

type Props = {
  login: (pin: string, touchID?: boolean, callback?: Function) => Function,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
  useBiometrics: ?boolean,
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
    const { useBiometrics } = this.props;
    if (useBiometrics && !this.errorMessage) {
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

    return (
      <Scene
        onPinEntered={this.handlePinSubmit}
        onForgotPin={this.handleForgotPasscode}
        walletState={walletState}
      />
    );
  }
}

const mapStateToProps = ({
  wallet,
  appSettings: { data: { useBiometrics = false } },
}) => ({
  wallet,
  useBiometrics,
});

const mapDispatchToProps = (dispatch: Function) => ({
  login: (pin: string, touchID?: boolean, callback?: Function) => dispatch(loginAction(pin, touchID, callback)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PinCodeUnlock);
