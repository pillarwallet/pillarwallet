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

import { connect } from 'react-redux';
import { Text } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { Container } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import styled from 'styled-components/native/index';
import { spacing } from 'utils/variables';
import TextInput from 'components/TextInput';

type Props = {
  checkPin: (pin: string, onValidPin: Function) => Function,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
}

export const FooterParagraph = styled(Paragraph)`
  margin-bottom: ${spacing.rhythm}px;
`;

class Sandbox extends React.PureComponent<Props, {}> {
  render() {
    return (
      <Container style={{ padding: 20 }}>
        <TextInput inputProps={{ value: '', placeholder: 'placeholder' }} />
        <TextInput inputProps={{ value: 'test' }} />
        <TextInput inputProps={{ value: '1000', numeric: true }} />
        <TextInput inputProps={{ value: 'bigText 20' }} inputType="bigText" />
        <TextInput inputProps={{ value: 'bigTextNoBackground 20' }} inputType="bigTextNoBackground" />
        <TextInput inputProps={{ value: 'amount 20' }} inputType="amount" />
        <Text>test</Text>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet: { data: wallet } }) => ({ wallet });

export default connect(mapStateToProps)(Sandbox);
