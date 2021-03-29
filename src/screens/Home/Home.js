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
import { Text, ScrollView } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import SafeAreaView from 'react-native-safe-area-view';
import styled from 'styled-components/native';

// Components
import Button from 'components/Button';

// Constants
import { MENU, ASSETS, CONNECT_FLOW, SERVICES_FLOW } from 'constants/navigationConstants';

function Home() {
  const navigation = useNavigation();

  return (
    <Container contentContainerStyle={{ flex: 1, justifyContent: 'center' }}>
      <Content>
        <MainContent>
          <Text>Hello Pillar!</Text>
        </MainContent>
        <NavActions>
          <Button block title="Menu" onPress={() => navigation.navigate(MENU)} secondary />
          <Button block title="Assets" onPress={() => navigation.navigate(ASSETS)} secondary />
          <Button block title="Wallet Connect" onPress={() => navigation.navigate(CONNECT_FLOW)} secondary />
          <Button block title="Sevices" onPress={() => navigation.navigate(SERVICES_FLOW)} secondary />
        </NavActions>
      </Content>
    </Container>
  );
}

export default Home;

const Container = styled(ScrollView)`
    flex: 1;
`;

const Content = styled(SafeAreaView)`
    flex: 1;
`;

const MainContent = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const NavActions = styled.View`
  width: 100%;
`;
