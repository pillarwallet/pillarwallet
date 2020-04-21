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
import { ScrollView, Image } from 'react-native';
import { withNavigation, type NavigationScreenProp } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import { fontStyles } from 'utils/variables';
import { BaseText, MediumText } from 'components/Typography';
import type { Theme } from 'models/Theme';
import { DARK_THEME } from 'constants/appSettingsConstants';
import { ASSETS } from 'constants/navigationConstants';
import Button from 'components/Button';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';

type Props = {
  theme: Theme,
  navigation: NavigationScreenProp<*>,
}

const Title = styled(MediumText)`
  ${fontStyles.large};
  margin: 24px 30px 0;
  text-align: center;
`;

const Text = styled(BaseText)`
  ${fontStyles.medium};
  margin: 35px 56px;
`;

const ButtonWrapper = styled.View`
  width: 100%;
  padding: 0 30px;
`;

const imageLight = require('assets/images/swActivatedLight.png');
const imageDark = require('assets/images/swActivatedLight.png');


const WalletActivated = (props: Props) => {
  const isDarkTheme = props.theme === DARK_THEME;
  const imgSource = isDarkTheme ? imageDark : imageLight;
  return (
    <ContainerWithHeader
      headerProps={{
          leftItems: [{ title: "What's next" }],
          rightItems: [{ close: true }],
          onClose: () => props.navigation.goBack(),
          close: true,
        }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <Title>Your Smart Wallet is now activated</Title>
        <Image source={imgSource} style={{ height: 137, width: '100%' }} resizeMode="stretch" />
        <Text>
          You can now access your new Smart Wallet and the new Pillar Payment Network from the upper right
          hand side of the Assets screen
        </Text>
        <ButtonWrapper>
          <Button
            title="Go to Smart Wallet"
            onPress={() => props.navigation.navigate(ASSETS)}
            secondary
            height={48}
            textStyle={fontStyles.medium}
          />
        </ButtonWrapper>
      </ScrollView>
    </ContainerWithHeader>
  );
};

export default withTheme(withNavigation(WalletActivated));
