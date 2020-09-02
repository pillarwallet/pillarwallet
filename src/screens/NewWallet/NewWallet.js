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
import { connect } from 'react-redux';
import t from 'translations/translate';

import { Container, Wrapper } from 'components/Layout';
import { BaseText } from 'components/Typography';
import Loader from 'components/Loader';
import Button from 'components/Button';
import { USERNAME_FAILED, REGISTRATION_FAILED } from 'constants/walletConstants';
import { APP_FLOW } from 'constants/navigationConstants';

const API_FAILURES = [USERNAME_FAILED, REGISTRATION_FAILED];

type Props = {
  navigation: NavigationScreenProp<*>,
  wallet: Object,
};

class NewWallet extends React.PureComponent<Props> {
  render() {
    const { wallet, navigation } = this.props;
    const { walletState } = wallet;

    const tryToReRegister = () => {
      navigation.navigate(APP_FLOW);
    };

    const failedToRegister = API_FAILURES.includes(walletState);

    return (
      <Container center={failedToRegister}>
        {!failedToRegister && (
          <Loader />
        )}
        {failedToRegister && (
          <Wrapper fullScreen center flex={1}>
            <BaseText style={{ marginBottom: 20 }} bigText={!failedToRegister}>
              Registration failed
            </BaseText>
            <Button title={t('auth:button.tryAgain')} onPress={tryToReRegister} />
          </Wrapper>
        )}
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });
export default connect(mapStateToProps)(NewWallet);
