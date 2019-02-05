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
import NewProfile from 'screens/NewProfile';
import { BaseText } from 'components/Typography';
import { registerOnBackendAction } from 'actions/onboardingActions';
import { Container } from 'components/Layout';
import Button from 'components/Button';
import Spinner from 'components/Spinner';
import { REGISTRATION_FAILED, USERNAME_EXISTS, USERNAME_OK, CHECKING_USERNAME } from 'constants/walletConstants';

type Props = {
  wallet: Object,
  registerOnBackend: () => Function,
};

const USERNAME_STATUS = [USERNAME_EXISTS, CHECKING_USERNAME, USERNAME_OK];

class RetryApiRegistration extends React.Component<Props> {
  componentDidMount() {
    const { registerOnBackend } = this.props;
    registerOnBackend();
  }

  render() {
    const { registerOnBackend, wallet: { walletState } } = this.props;
    if (USERNAME_STATUS.includes(walletState)) {
      return <NewProfile retry />;
    }
    return (
      <Container center>
        <BaseText style={{ marginBottom: 20 }}>Registering on backend</BaseText>
        {walletState !== REGISTRATION_FAILED && (
          <Spinner />
        )}
        {walletState === REGISTRATION_FAILED && (
          <Button title="Try again" onPress={registerOnBackend} />
        )}
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });
const mapDispatchToProps = (dispatch: Function) => ({
  registerOnBackend: () => {
    dispatch(registerOnBackendAction());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(RetryApiRegistration);
