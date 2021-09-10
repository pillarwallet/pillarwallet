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
import t from 'translations/translate';

import { Container } from 'components/legacy/Layout';
import CheckAuth from 'components/CheckAuth';
import Loader from 'components/Loader';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { CHANGE_PIN_NEW_PIN } from 'constants/navigationConstants';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

type Props = {
  navigation: NavigationScreenProp<*>,
  resetIncorrectPassword: () => void,
  isDecrypting: boolean,
};

class CurrentPin extends React.Component<Props> {
  handleScreenDismissal = () => {
    this.props.resetIncorrectPassword();
    this.props.navigation.dismiss();
  };

  render() {
    const { navigation, isDecrypting } = this.props;

    if (isDecrypting) {
      return (
        <Container center>
          <Loader messages={[t('label.checking')]} />
        </Container>
      );
    }

    return (
      <CheckAuth
        revealMnemonic
        onPinValid={(currentPin) => navigation.navigate(CHANGE_PIN_NEW_PIN, { currentPin })}
        headerProps={{ onClose: this.handleScreenDismissal }}
        enforcePin
      />
    );
  }
}

const mapStateToProps = ({
  wallet: { isDecrypting },
}: RootReducerState): $Shape<Props> => ({
  isDecrypting,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(CurrentPin);
