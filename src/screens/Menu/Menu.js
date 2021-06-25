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
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';

// Components
import { Container, Content } from 'components/modern/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Image from 'components/Image';
import Text from 'components/modern/Text';

// Utils
import { useThemedImages } from 'utils/images';

const Menu = () => {
  const navigation = useNavigation();
  const { pillarLogoSmall: logo } = useThemedImages();

  return (
    <Container>
      <HeaderBlock
        leftItems={[{ close: true }]}
        centerItems={[{ custom: <HeaderLogo source={logo} /> }]}
        navigation={navigation}
      />
      <Content>
        <Text>Menu</Text>
      </Content>
    </Container>
  );
};

export default Menu;

const HeaderLogo = styled(Image)`
  width: 68px;
  height: 20px;
`;