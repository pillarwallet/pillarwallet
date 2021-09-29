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
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

import { Container } from 'components/legacy/Layout';
import Header from 'components/Header';
import PinCode from 'components/PinCode';
import ErrorMessage from 'components/ErrorMessage';
import { CHANGE_PIN_CONFIRM_NEW_PIN } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  pin: string,
};

type State = {
  pinError: string,
};

export default class NewPin extends React.Component<Props, State> {
  state = {
    pinError: '',
  };

  handlePinSubmit = (newPin: string) => {
    const { navigation } = this.props;
    const currentPin = navigation.getParam('currentPin');

    if (currentPin === newPin) {
      this.setState({
        pinError: t('error.pin.newShouldBeDifferent'),
      });
      return;
    }

    navigation.navigate(CHANGE_PIN_CONFIRM_NEW_PIN, {
      currentPin,
      newPin,
    });
  };

  handlePinChange = () => {
    this.setState({
      pinError: '',
    });
  };

  handleScreenDismissal = () => {
    this.props.navigation.dismiss();
  };

  render() {
    const { pinError } = this.state;
    const showError = pinError ? <ErrorMessage>{pinError}</ErrorMessage> : null;

    return (
      <Container>
        <Header
          title={t('title.enterNewPincode')}
          centerTitle
          onClose={this.handleScreenDismissal}
        />
        {showError}
        <PinCode
          onPinEntered={this.handlePinSubmit}
          onPinChanged={this.handlePinChange}
          showForgotButton={false}
          pinError={!!pinError}
          maxPinCodeLength={4}
        />
      </Container>
    );
  }
}
