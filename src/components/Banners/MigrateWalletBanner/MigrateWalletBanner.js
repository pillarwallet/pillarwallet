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
import { View } from 'react-native';
import styled from 'styled-components/native';

import Text from 'components/modern/Text';

import { spacing } from 'utils/variables';

function MigrateWalletBanner() {
  return (
    <Container>
      <Text variant="big">Migrate to Smart Wallet</Text>
      <Text>Transfer all your assets to an advanced platform and start earning with new features.</Text>
    </Container>
  );
}

const Container: typeof View = styled.View`
  margin-bottom: ${spacing.large}px;
  padding: ${spacing.large}px;
  background-color: green;
`;

export default MigrateWalletBanner;
