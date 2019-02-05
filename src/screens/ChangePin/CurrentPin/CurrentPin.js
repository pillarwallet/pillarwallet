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
import { Container } from 'components/Layout';
import Header from 'components/Header';
import CheckPin from 'components/CheckPin';
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { DECRYPTING } from 'constants/walletConstants';
import { CHANGE_PIN_NEW_PIN } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  resetIncorrectPassword: () => Function,
  walletState: ?string,
};

class CurrentPin extends React.Component<Props> {
  handleScreenDismissal = () => {
    this.props.resetIncorrectPassword();
    this.props.navigation.dismiss();
  };

  render() {
    const { navigation, walletState } = this.props;

    if (walletState === DECRYPTING) {
      return (
        <Container center>
          <BaseText style={{ marginBottom: 20 }}>Checking</BaseText>
          <Spinner />
        </Container>
      );
    }

    return (
      <Container>
        <Header
          title="enter pincode"
          centerTitle
          onClose={this.handleScreenDismissal}
        />
        <CheckPin
          revealMnemonic
          onPinValid={(currentPin) => navigation.navigate(CHANGE_PIN_NEW_PIN, { currentPin })}
        />
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet: { walletState } }) => ({ walletState });

const mapDispatchToProps = (dispatch: Function) => ({
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(CurrentPin);
