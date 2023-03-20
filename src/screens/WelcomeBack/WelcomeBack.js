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
import { Keyboard, Platform } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import t from 'translations/translate';

// Components
import { Container, Content } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import { Wrapper } from 'components/legacy/Layout';
import { MediumText, Paragraph } from 'components/legacy/Typography';
import Button from 'components/legacy/Button';
import ProfileImage from 'components/ProfileImage';

// Constants
import { PERMISSIONS, SET_WALLET_PIN_CODE } from 'constants/navigationConstants';

// Selectors
import { useRootSelector } from 'selectors';

// Utils
import { fontStyles } from 'utils/variables';

// Types
import type { OnboardingUser } from 'models/User';

const PROFILE_IMAGE_WIDTH = 144;

const WelcomeBack = () => {
  const navigation = useNavigation();

  const user = useRootSelector((root) => root.onboarding.user);
  const wallet = useRootSelector((root) => root.onboarding.wallet);

  const existingUser = !!user?.isExisting;

  const proceedToNextScreen = () => {
    Keyboard.dismiss();
    const navProps = user?.username ? user?.username : null;
    if (Platform.OS === 'android') {
      // $FlowFixMe: react-navigation types
      navigation.navigate(PERMISSIONS, navProps);
    } else {
      // $FlowFixMe: react-navigation types
      navigation.navigate(SET_WALLET_PIN_CODE, navProps);
    }
  };

  const renderWelcomeBack = () => (
    <Wrapper flex={1} center regularPadding>
      <ProfileImage
        diameter={PROFILE_IMAGE_WIDTH}
        style={{ marginBottom: 47 }}
        userName={!user?.username ? wallet?.address : user?.username}
      />
      <UsernameWrapper>
        <Text>{t('auth:title.welcomeBack', { username: user?.username })}</Text>
      </UsernameWrapper>
      <Paragraph small light center style={{ marginBottom: 40, paddingLeft: 40, paddingRight: 40 }}>
        {t('auth:paragraph.successfullyRestoredWallet')}
      </Paragraph>
      <Button
        marginBottom={20}
        onPress={proceedToNextScreen}
        title={t('auth:button.next')}
        testID={`${TAG}-button-next`}
        // eslint-disable-next-line i18next/no-literal-string
        accessibilityLabel={`${TAG}-button-next`}
      />
    </Wrapper>
  );

  return (
    <Container>
      <HeaderBlock noBack navigation={navigation} />
      <Content paddingHorizontal={0} paddingVertical={0} scrollEnabled={!existingUser}>
        <ContentWrapper>{existingUser && renderWelcomeBack()}</ContentWrapper>
      </Content>
    </Container>
  );
};

export default WelcomeBack;

export const getUsernameInputIcon = (
  colors: Object,
  isUsernameInputDirty: boolean,
  isCheckingUsername: boolean,
  user: ?OnboardingUser,
  usernameValidationErrorMessage: ?string,
  errorMessage: ?string,
) => {
  let statusIcon = null;
  let iconColor = null;

  if (isUsernameInputDirty && !isCheckingUsername) {
    if (usernameValidationErrorMessage || errorMessage) {
      statusIcon = 'close'; // eslint-disable-line i18next/no-literal-string
      iconColor = colors.negative;
    } else if (user?.username) {
      statusIcon = 'check'; // eslint-disable-line i18next/no-literal-string
      iconColor = colors.positive;
    }
  }

  return { statusIcon, iconColor };
};

const UsernameWrapper = styled(Wrapper)`
  margin: 36px 0 20px;
  align-self: center;
  justify-content: flex-end;
  align-items: center;
  position: relative;
  top: 2px;
`;

const Text = styled(MediumText)`
  ${fontStyles.big};
  width: 100%;
  text-align: center;
  max-width: 230px;
`;

const ContentWrapper = styled.View`
  flex: 1;
`;

const TAG = 'WelcomeBack';
