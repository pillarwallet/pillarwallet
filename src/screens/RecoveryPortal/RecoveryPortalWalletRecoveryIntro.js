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
import styled, { withTheme } from 'styled-components/native';
import { View } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';

// constants
import { IMPORT_WALLET, RECOVERY_PORTAL_WALLET_RECOVERY } from 'constants/navigationConstants';

// components
import { ScrollWrapper } from 'components/Layout';
import Button from 'components/Button';
import { MediumText, BaseText, Paragraph, HelpText } from 'components/Typography';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ButtonText from 'components/ButtonText';
import Icon from 'components/Icon';

// utils
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';

// types
import type { Theme } from 'models/Theme';


type Props = {
  navigation: NavigationScreenProp,
  theme: Theme,
};

const Title = styled(MediumText)`
  ${fontStyles.large};
  text-align: center;
  margin-top: 30px;
  margin-bottom: ${spacing.small}px;
`;

const WarningTitle = styled(BaseText)`
  ${fontStyles.big};
  color: ${themedColors.negative};
`;

const WarningIcon = styled(Icon)`
  color: ${themedColors.negative};
  font-size: ${fontSizes.medium}px;
  margin-right: ${spacing.small}px;
`;

const WarningTitleRow = styled.View`
  margin-top: 20px;
  margin-bottom: ${spacing.small}px;
  flex-direction: row;
  align-items: center;
`;

const RecoveryPortalWalletRecoveryIntro = (props: Props) => {
  const { navigation, theme } = props;
  const colors = getThemeColors(theme);
  return (
    <ContainerWithHeader headerProps={{ centerItems: [{ title: 'Recovery options' }] }}>
      <ScrollWrapper regularPadding>
        <Title center>Recover Pillar Smart Wallet</Title>
        <Paragraph small>
          This method of recovery is available for Smart Wallet you
          have created previously with Pillar app. Log in to Recovery
          Portal and scan QR code from your linked device.
        </Paragraph>
        <WarningTitleRow>
          <WarningIcon name="warning" />
          <WarningTitle>Warning</WarningTitle>
        </WarningTitleRow>
        <HelpText color={colors.negative} noPadding>
          After recovering your Smart Wallet you will be given a new Key wallet.
          You will not be able to retain access to your old Key wallet attached to Smart Wallet
          you are about to recover. Please ensure you have another option of recovering Key wallet,
          such as recover by entering your 12 words seed phrase or private key.
        </HelpText>
        <View style={{ alignItems: 'center' }}>
          <Button
            block
            title="Proceed"
            onPress={() => navigation.navigate(RECOVERY_PORTAL_WALLET_RECOVERY)}
            marginTop={50}
            marginBottom={spacing.large}
          />
          <ButtonText
            buttonText="Recover Key wallet first"
            onPress={() => navigation.navigate(IMPORT_WALLET)}
            fontSize={fontSizes.medium}
            medium
          />
        </View>
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

export default withTheme(RecoveryPortalWalletRecoveryIntro);
