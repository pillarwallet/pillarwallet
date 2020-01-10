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
import { CachedImage } from 'react-native-cached-image';
import type { NavigationScreenProp } from 'react-navigation';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper, Wrapper } from 'components/Layout';
import { MediumText, BoldText } from 'components/Typography';
import Button from 'components/Button';

// utils
import { fontStyles } from 'utils/variables';
import { responsiveSize } from 'utils/ui';


type Props = {
  navigation: NavigationScreenProp,
}

const CustomWrapper = styled.View`
  flex: 1;
  padding: 20px 55px 20px 46px;
`;

const Title = styled(BoldText)`
  color: #cea240;
  ${fontStyles.rGiant};
`;

const BodyText = styled(MediumText)`
  color: #ec9700;
  ${fontStyles.rBig};
  margin-top: ${responsiveSize(26)}px;
`;

const ButtonWrapper = styled(Wrapper)`
  margin: 30px 0 50px;
  padding: 0 46px;
`;

const FeatureIcon = styled(CachedImage)`
  height: 124px;
  width: 124px;
  margin-bottom: 24px;
`;

const smartWalletIcon = require('assets/images/logo_recovery_device.png');

const RecoveryPortalSetupIntro = (props: Props) => (
  <ContainerWithHeader
    headerProps={{ floating: true }}
    backgroundColor="#faf3f5"
  >
    <ScrollWrapper contentContainerStyle={{ paddingTop: 80 }}>
      <CustomWrapper>
        <FeatureIcon source={smartWalletIcon} />
        <Title>Recovery device</Title>
        <BodyText>
          Recovery agents are individuals, services or secondary devices, like,
          hardware wallets that you choose to assist you with recovering access
          to your Smart Wallet if you happen to lose your device or master key.
        </BodyText>
      </CustomWrapper>
      <ButtonWrapper>
        <Button
          block
          title="Next"
          onPress={() => {}}
        />
      </ButtonWrapper>
    </ScrollWrapper>
  </ContainerWithHeader>
);

export default RecoveryPortalSetupIntro;
