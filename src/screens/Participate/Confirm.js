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
import { Text } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import Header from 'components/Header';
import Button from 'components/Button';
import { Container, Wrapper } from 'components/Layout';

type Props = {
  navigation: NavigationScreenProp<*>,
}

const ConfirmScreen = (props: Props) => {
  const { navigation } = props;

  const navigateBack = () => {
    navigation.goBack();
  };

  const endFlow = () => {
    navigation.dismiss();
  };

  return (
    <Container>
      <Header
        onBack={navigateBack}
        title="review and confirm"
      />
      <Wrapper flex={1} regularPadding center>
        <Text>Confirm</Text>
        <Button block title="Confirm transaction" onPress={endFlow} />
      </Wrapper>
    </Container>
  );
};

export default ConfirmScreen;
