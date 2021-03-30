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
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';

// Components
import BalanceView from 'components/BalanceView';
import Button from 'components/Button';
import Text from 'components/modern/Text';

function BalanceSection() {
  const navigation = useNavigation();

  return (
    <Container>
      <FirstColumn>
        <BalanceView balance={123.45} />
        <Text>Last week +23.69% ($642.7)</Text>
      </FirstColumn>
      <SecondColumn>
        <Button small block title="Add cash" />
      </SecondColumn>
    </Container>
  );
}

export default BalanceSection;

const Container = styled.View`
  flex-direction: row;
`;

const FirstColumn = styled.View`
  flex: 1;
`;

const SecondColumn = styled.View`
`;
