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
import { View } from 'react-native';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';

// components
import { Wrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Paragraph } from 'components/Typography';
import Button from 'components/Button';

// constants
import { SMART_WALLET_INTRO } from 'constants/navigationConstants';

// util
import { spacing } from 'utils/variables';

type Props = {
  navigation: NavigationScreenProp<*>,
};

const SeparatorValue = styled(Paragraph)`
  padding: 0px 8px;
`;

const ArrowSymbol = () => <SeparatorValue light>&nbsp;&rarr;&nbsp;</SeparatorValue>;

class ExchangeReceiveExplained extends React.Component<Props> {
  assetSymbol: string;

  constructor(props: Props) {
    super(props);
    const { navigation } = props;
    this.assetSymbol = navigation.getParam('assetSymbol', '');
  }

  handleBack = () => {
    this.props.navigation.goBack();
  };

  render() {
    const { navigation } = this.props;
    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Activate Smart Wallet' }],
          rightItems: [{ close: true }],
          noBack: true,
          onClose: this.handleBack,
        }}
      >
        <Wrapper flex={1} center regularPadding>
          <View style={{ justifyContent: 'center', flex: 1, alignItems: 'center' }}>
            <Paragraph center>Activate Smart Wallet</Paragraph>
            <Paragraph center style={{ paddingBottom: spacing.rhythm }}>
              in order to receive exchanged tokens into <ArrowSymbol /> Smart Wallet.
            </Paragraph>
            <Button
              onPress={() => navigation.navigate(SMART_WALLET_INTRO)}
              title="Activate Smart Wallet"
            />
          </View>
        </Wrapper>
      </ContainerWithHeader>
    );
  }
}

export default ExchangeReceiveExplained;
