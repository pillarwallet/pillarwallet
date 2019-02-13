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
import { SECURITY_CONFIRM, IMPORT_WALLET } from 'constants/navigationConstants';
import { Container, Wrapper, Footer } from 'components/Layout';
import Header from 'components/Header';
import { Paragraph } from 'components/Typography';
import Button from 'components/Button';

type Props = {
  navigation: NavigationScreenProp<*>,
};

class Onboarding extends React.Component<Props> {
  createNewWallet = () => {
    this.props.navigation.navigate(SECURITY_CONFIRM);
  };

  importOldWallet = () => {
    this.props.navigation.navigate(IMPORT_WALLET);
  };

  render() {
    return (
      <Container>
        <Header title="welcome" onBack={() => this.props.navigation.goBack(null)} />
        <Wrapper regularPadding>
          <Paragraph>Pillar is a next-generation digital wallet
            and application for personal data management.
          </Paragraph>
        </Wrapper>
        <Footer>
          <Button block marginBottom="20px" marginTop="20px" onPress={this.createNewWallet} title="Setup New Wallet" />
          <Button block onPress={this.importOldWallet} secondary title="Import Wallet" />
        </Footer>
      </Container>
    );
  }
}
export default Onboarding;
