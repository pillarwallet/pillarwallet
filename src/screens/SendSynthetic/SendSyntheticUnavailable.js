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

// util
import { fontSizes, spacing } from 'utils/variables';

type Props = {
  navigation: NavigationScreenProp<*>,
};

const Description = styled(Paragraph)`
  text-align: center;
  padding-bottom: ${spacing.rhythm}px;
  ${fontSizes.regular};
`;

class ExchangeConfirmScreen extends React.Component<Props> {
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
    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Can\'t send a token?' }],
          rightItems: [{ close: true }],
          noBack: true,
          onClose: this.handleBack,
        }}
      >
        <Wrapper flex={1} center regularPadding>
          <View style={{ justifyContent: 'center', flex: 1, alignItems: 'center' }}>
            <Description>
              It is a great feature of Pillar – to be able to send tokens that you do not even own yet.
              Sometimes it works differently.
            </Description>
            <Description>
              {`Not enough liquidity means that there are no ${this.assetSymbol} tokens available to send.`}
            </Description>
          </View>
        </Wrapper>
      </ContainerWithHeader>
    );
  }
}

export default ExchangeConfirmScreen;
