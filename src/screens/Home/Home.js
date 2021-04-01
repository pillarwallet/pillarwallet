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
import { LayoutAnimation } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';

// Components
import { Container, Content } from 'components/modern/Layout';
import Button from 'components/Button';
import FloatingButtons from 'components/FloatingButtons';
import HeaderBlock from 'components/HeaderBlock';
import UserNameAndImage from 'components/UserNameAndImage';

// Constants
import { ASSETS, MENU, SERVICES_FLOW } from 'constants/navigationConstants';

// Selectors
import { useUser } from 'selectors/user';

// Utils
import { LIST_ITEMS_APPEARANCE } from 'utils/layoutAnimations';

// Local
import BalanceSection from './BalanceSection';
import AssetsSection from './AssetsSection';
import Controls from './Controls';
import FloatingActions from './FloatingActions';

function Home() {
  const navigation = useNavigation();

  const [showSideChains, setShowSideChains] = React.useState(false);

  const user = useUser();

  const handleToggleSideChains = () => {
    LayoutAnimation.configureNext(LIST_ITEMS_APPEARANCE);
    setShowSideChains(!showSideChains);
  };

  return (
    <Container>
      <HeaderBlock
        leftItems={[
          {
            icon: 'hamburger',
            iconProps: { secondary: true, style: { marginLeft: -4 } },
            onPress: () => navigation.navigate(MENU),
          },
        ]}
        centerItems={[{ custom: <UserNameAndImage user={user} /> }]}
        navigation={navigation}
        noPaddingTop
      />
      <Content contentContainerStyle={{ paddingBottom: FloatingButtons.SCROLL_VIEW_BOTTOM_INSET }}>
        <BalanceSection />

        <Controls showSideChains={showSideChains} onToggleSideChains={handleToggleSideChains} />

        <AssetsSection showSideChains={showSideChains} />

        {/* Temporary navigation section */}
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <NavButton title="Assets" onPress={() => navigation.navigate(ASSETS)} secondary />
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <NavButton title="Sevices" onPress={() => navigation.navigate(SERVICES_FLOW)} secondary />
      </Content>

      <FloatingActions />
    </Container>
  );
}

export default Home;

const NavButton = styled(Button)`
  width: 100%;
  align-self: center;
  margin: 20px 20px 0;
`;
