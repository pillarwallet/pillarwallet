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
import { Dimensions, ScrollView, FlatList } from 'react-native';
import { useDispatch } from 'react-redux';
import styled, { ThemeProvider } from 'styled-components/native';
import t from 'translations/translate';
import LinearGradient from 'react-native-linear-gradient';
import { LOGIN_PROVIDER } from '@web3auth/react-native-sdk';

// actions
import { resetOnboardingAndNavigateAction } from 'actions/onboardingActions';

// components
import { Spacing } from 'components/legacy/Layout';
import Button from 'components/legacy/Button';
import Icon from 'components/core/Icon';
import IconWithBackgroundGif from 'components/Gif/IconWithBackgroundGif';
import { MediumText } from 'components/legacy/Typography';
import Text from 'components/core/Text';
import Spinner from 'components/Spinner';
import Modal from 'components/Modal';
import SigninWithEmailModal from 'components/Modals/SigninWithEmailModal';

// utils
import { spacing } from 'utils/variables';
import { getThemeByType, useThemeColors } from 'utils/themes';
import { getNotificationsVisibleStatus } from 'utils/getNotification';

// Service
import { loginWithWeb3Auth } from 'services/web3Auth';
import { firebaseRemoteConfig } from 'services/firebase';

// Selectors
import { useRootSelector } from 'selectors';

// constants
import { NEW_IMPORT_WALLET, GET_NOTIFICATIONS, SET_WALLET_PIN_CODE } from 'constants/navigationConstants';
import { DARK_THEME } from 'constants/appSettingsConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

const Welcome = () => {
  const darkTheme = getThemeByType(DARK_THEME);
  const { width, height } = Dimensions.get('window');
  const visibleWeb3AuthSignin = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.VISIBILE_WEB3_AUTH);

  const dispatch = useDispatch();
  const colors = useThemeColors();
  const { isImportingWallet } = useRootSelector((state) => state.onboarding);

  const onNavigate = async (nextRoutePath) => {
    const status = await getNotificationsVisibleStatus();
    dispatch(resetOnboardingAndNavigateAction(status === undefined ? GET_NOTIFICATIONS : nextRoutePath, nextRoutePath));
  };

  const openEmailModal = () =>
    Modal.open(() => (
      <SigninWithEmailModal
        onSave={(email) => {
          dispatch(loginWithWeb3Auth(LOGIN_PROVIDER.EMAIL_PASSWORDLESS, email));
        }}
      />
    ));

  const SOCIAL_AUTH_LIST = [
    {
      name: 'google',
      icon: 'google-button',
      onPress: () => dispatch(loginWithWeb3Auth(LOGIN_PROVIDER.GOOGLE)),
    },
    {
      name: 'facebook',
      icon: 'facebook-button',
      onPress: () => dispatch(loginWithWeb3Auth(LOGIN_PROVIDER.FACEBOOK)),
    },
    {
      name: 'apple',
      icon: 'apple-button',
      onPress: () => dispatch(loginWithWeb3Auth(LOGIN_PROVIDER.APPLE)),
    },
    {
      name: 'discord',
      icon: 'discord-button',
      onPress: () => dispatch(loginWithWeb3Auth(LOGIN_PROVIDER.DISCORD)),
    },
    {
      name: 'twitch',
      icon: 'twitch-button',
      onPress: () => dispatch(loginWithWeb3Auth(LOGIN_PROVIDER.TWITCH)),
    },
    {
      name: 'email',
      icon: 'email-button',
      onPress: openEmailModal,
    },
  ];

  return (
    <ThemeProvider theme={darkTheme}>
      <Background>
        <ScrollView>
          <Spacing h={height * 0.04} />
          <IconWithBackgroundGif size={width * 0.3} />

          <MediumText color={colors.basic000} fontSize={24} style={{ textAlign: 'center' }}>
            {t('auth:title.welcomeToPillarGetStarted')}
          </MediumText>
          {visibleWeb3AuthSignin ? (
            <>
              <Spacing h={height * 0.07} />

              <ListView
                numColumns={3}
                data={SOCIAL_AUTH_LIST}
                scrollEnabled={false}
                contentContainerStyle={{ alignItems: 'center' }}
                style={{ width: '100%', maxHeight: 150 }}
                renderItem={({ item }) => (
                  <Touchable key={item.name} onPress={item.onPress}>
                    <Icon name={item.icon} width={width * 0.27} />
                  </Touchable>
                )}
              />
              <RowWrapper>
                <LinearGradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  colors={['rgba(208, 104, 255, 0.73)', 'rgba(201, 55, 255, 0.5)']}
                  style={{ width: '36%', height: 1 }}
                />
                <Text variant="medium" color={colors.purpleHeat} style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
                  {t('label.or')}
                </Text>
                <LinearGradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  colors={['rgba(165, 104, 255, 0.73)', 'rgba(55, 128, 255, 0.5)']}
                  style={{ width: '36%', height: 1 }}
                />
              </RowWrapper>
            </>
          ) : (
            <Spacing h={height * 0.3} />
          )}

          <SubContainer>
            <Icon name="button-border-color" style={{ position: 'absolute' }} width={width * 0.9} />
            <Button
              title={t('auth:button.newWallet')}
              style={{ width: width * 0.9 }}
              onPress={async () => {
                await onNavigate(SET_WALLET_PIN_CODE);
              }}
              transparent
            />
          </SubContainer>

          <SubContainer>
            <Icon name="button-border-color" style={{ position: 'absolute' }} width={width * 0.9} />
            <Button
              title={t('auth:button.recoverWallet')}
              style={{ width: width * 0.9 }}
              onPress={async () => {
                await onNavigate(NEW_IMPORT_WALLET);
              }}
              transparent
            />
          </SubContainer>
        </ScrollView>
        {isImportingWallet && (
          <LoaderContainer>
            <Spinner size={40} />
          </LoaderContainer>
        )}
      </Background>
    </ThemeProvider>
  );
};

export default Welcome;

const Background = styled.View`
  background-color: ${({ theme }) => theme.colors.basic070};
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const Touchable = styled.TouchableOpacity`
  align-items: center;
  justify-content: center;
  margin: 9px 7.5px;
`;

const SubContainer = styled.View`
  width: 100%;
  padding: 9px ${spacing.layoutSides}px;
  align-items: center;
  justify-content: center;
`;

const RowWrapper = styled.View`
  width: 100%;
  align-items: center;
  justify-content: center;
  flex-direction: row;
`;

const ListView = styled(FlatList)``;

const LoaderContainer = styled.View`
  position: absolute;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => `${theme.colors.basic050}60`};
`;
