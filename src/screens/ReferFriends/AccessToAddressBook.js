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
import styled from 'styled-components/native';

import { Paragraph } from 'components/Typography';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import { Wrapper } from 'components/Layout';

import { spacing } from 'utils/variables';
import type { NavigationScreenProp } from 'react-navigation';
import { REFERRAL_CONTACTS } from 'constants/navigationConstants';


type Props = {
  navigation: NavigationScreenProp<*>,
}

const ButtonWrapper = styled.View`
  flex: 1;
  justify-content: center;
`;


class AccessToAddressBook extends React.PureComponent<Props> {
  render() {
    const { navigation } = this.props;

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Access to address book' }] }}
      >
        <Wrapper flex={1} regularPadding>
          <Paragraph style={{ marginTop: spacing.layoutSides }}>
            Please grant access to your address book in order to be able to choose your phone or email contacts.
            It is totally safe to provide this and neither Pillar nor other third parties would have access to this
            data.
          </Paragraph>
          <ButtonWrapper>
            <Button title="Confirm" onPress={() => navigation.navigate(REFERRAL_CONTACTS)} block />
          </ButtonWrapper>
        </Wrapper>
      </ContainerWithHeader>
    );
  }
}

export default AccessToAddressBook;
