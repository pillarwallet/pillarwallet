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

import { Container } from 'components/Layout';
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import Button from 'components/Button';
import { REGISTRATION_FAILED, USERNAME_EXISTS } from 'constants/walletConstants';
import { APP_FLOW } from 'constants/navigationConstants';

const API_FAILURES = [USERNAME_EXISTS, REGISTRATION_FAILED];

type Props = {
  navigation: NavigationScreenProp<*>,
  wallet: Object,
};

const NewWallet = (props: Props) => {
  const { walletState } = props.wallet;
  let statusMessage = walletState || '';
  let showSpinner = true;
  let note = null;

  const tryToReRegister = () => {
    props.navigation.navigate(APP_FLOW);
  };

  if (API_FAILURES.includes(walletState)) {
    statusMessage = 'REGISTRATION FAILED';
    showSpinner = false;
    note = <Button title="Try again" onPress={tryToReRegister} />;
  }

  return (
    <Container center>
      <BaseText style={{ marginBottom: 20 }}>{statusMessage}</BaseText>
      {!!showSpinner && (
        <Spinner />
      )}
      {note}
    </Container>
  );
};

const mapStateToProps = ({ wallet }) => ({ wallet });
export default connect(mapStateToProps)(NewWallet);
