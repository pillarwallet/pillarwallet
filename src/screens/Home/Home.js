// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';

// Components
import { Container, Content } from 'components/modern/Layout';
import Button from 'components/Button';
import HeaderBlock from 'components/HeaderBlock';
import UserNameAndImage from 'components/UserNameAndImage';

// Constants
import { MENU, ASSETS, CONNECT_FLOW, SERVICES_FLOW } from 'constants/navigationConstants';

// Selectors
import { useUser } from 'selectors/user';

function Home() {
  const navigation = useNavigation();
  const user = useUser();

  return (
    <Container>
      <HeaderBlock
        leftItems={[
          {
            icon: 'hamburger',
            onPress: () => navigation.navigate(MENU),
            iconProps: { secondary: true, style: { marginLeft: -4 } },
          },
        ]}
        centerItems={[{ custom: <UserNameAndImage user={user} /> }]}
        navigation={navigation}
        noPaddingTop
      />
      <Content>
        {/* Temporary content */}
        <MainContent>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Text>Hello Pillar!</Text>
        </MainContent>

        {/* Temporary navigation section */}
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <NavButton title="Assets" onPress={() => navigation.navigate(ASSETS)} secondary />
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <NavButton title="Wallet Connect" onPress={() => navigation.navigate(CONNECT_FLOW)} secondary />
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <NavButton title="Sevices" onPress={() => navigation.navigate(SERVICES_FLOW)} secondary />
      </Content>
    </Container>
  );
}

export default Home;

const MainContent = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const NavButton = styled(Button)`
  align-self: stretch;
  margin: 10px 20px;
`;
