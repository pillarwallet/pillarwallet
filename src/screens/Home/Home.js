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
import Button from 'components/Button';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
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
    <ContainerWithHeader
      headerProps={{
        leftItems: [
          {
            icon: 'hamburger',
            onPress: () => navigation.navigate(MENU),
            iconProps: { secondary: true, style: { marginLeft: -4 } },
          },
        ],
        // $FlowFixMe: react-navigation types
        centerItems: [{ custom: <UserNameAndImage user={user} /> }],
        sideFlex: '25px',
      }}
      inset={{ bottom: 0 }}
      tab
    >
      <HeaderBlock
        leftItems={[
          {
            icon: 'hamburger',
            onPress: () => navigation.navigate(MENU),
            iconProps: { secondary: true, style: { marginLeft: -4 } },
          },
        ]}
        centerItems={[{ custom: <UserNameAndImage user={user} /> }]}
        sideFlex="25px"
        navigation={navigation}
        noPaddingTop
      />
      <MainContent>
        <Text>Hello Pillar!</Text>
      </MainContent>
      <NavActions>
        <Button block title="Menu" onPress={() => navigation.navigate(MENU)} secondary />
        <Button block title="Assets" onPress={() => navigation.navigate(ASSETS)} secondary />
        <Button block title="Wallet Connect" onPress={() => navigation.navigate(CONNECT_FLOW)} secondary />
        <Button block title="Sevices" onPress={() => navigation.navigate(SERVICES_FLOW)} secondary />
      </NavActions>
    </ContainerWithHeader>
  );
}

export default Home;

const MainContent = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const NavActions = styled.View`
  width: 100%;
`;
