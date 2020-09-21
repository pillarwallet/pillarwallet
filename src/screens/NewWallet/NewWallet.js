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
import React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import t from 'translations/translate';

// components
import { Container, Wrapper } from 'components/Layout';
import { BaseText } from 'components/Typography';
import Loader from 'components/Loader';
import Button from 'components/Button';

// constants
import { APP_FLOW } from 'constants/navigationConstants';


type Props = {
  navigation: NavigationScreenProp<*>,
  errorMessage: ?string,
};

const NewWallet = ({
  errorMessage,
  navigation,
}: Props) => (
  <Container center={!!errorMessage}>
    {!errorMessage && <Loader />}
    {!!errorMessage && (
      <Wrapper fullScreen center flex={1}>
        <BaseText style={{ marginBottom: 20 }} bigText={!errorMessage}>
          Registration failed
        </BaseText>
        <Button title={t('auth:button.tryAgain')} onPress={() => navigation.navigate(APP_FLOW)} />
      </Wrapper>
    )}
  </Container>
);

const mapStateToProps = ({ onboarding: { errorMessage } }) => ({ errorMessage });

export default connect(mapStateToProps)(NewWallet);
