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
import { Dimensions, FlatList, ScrollView } from 'react-native';
import { useDispatch } from 'react-redux';
import styled, { ThemeProvider } from 'styled-components/native';
import t from 'translations/translate';

// actions
import { resetOnboardingAndNavigateAction } from 'actions/onboardingActions';

// components
import { Spacing } from 'components/legacy/Layout';
import Image from 'components/Image';
import Button from 'components/legacy/Button';
import Icon from 'components/core/Icon';
import Text from 'components/core/Text';

// utils
import { spacing } from 'utils/variables';
import { getThemeByType, useThemeColors } from 'utils/themes';

// constants
import { IMPORT_WALLET_LEGALS, GET_NOTIFICATIONS } from 'constants/navigationConstants';
import { DARK_THEME } from 'constants/appSettingsConstants';
import LinearGradient from 'react-native-linear-gradient';

// Assets
const logoBackgroundGif = require('assets/images/glow.gif');

const SOCIAL_AUTH_LIST = [
  { name: 'google', icon: 'google-button' },
  { name: 'facebook', icon: 'facebook-button' },
  { name: 'apple', icon: 'apple-button' },
  { name: 'discord', icon: 'discord-button' },
  { name: 'twitch', icon: 'twitch-button' },
  { name: 'email', icon: 'email-button' },
];

const Welcome = () => {
  const darkTheme = getThemeByType(DARK_THEME);
  const { width } = Dimensions.get('window');

  const dispatch = useDispatch();
  const colors = useThemeColors();

  return (
    <ThemeProvider theme={darkTheme}>
      <Background>
        <ScrollView>
          <Spacing h={30} />
          <SubContainer>
            <Image source={logoBackgroundGif} style={{ width: 280, height: 280 }} />
            <Icon name="plr-white-logo" style={{ position: 'absolute' }} />
          </SubContainer>

          <Text variant="large" style={{ textAlign: 'center' }}>
            {t('auth:title.welcomeToPillarGetStarted')}
          </Text>

          <Spacing h={60} />

          <ListView
            numColumns={3}
            data={SOCIAL_AUTH_LIST}
            scrollEnabled={false}
            contentContainerStyle={{ alignItems: 'center' }}
            style={{ width: '100%', maxHeight: 150 }}
            renderItem={({ item }) => (
              <Touchable key={item.name}>
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
            <Text variant="medium" color={colors.purpleHeat} style={{ padding: 20 }}>
              {t('label.or')}
            </Text>
            <LinearGradient
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              colors={['rgba(165, 104, 255, 0.73)', 'rgba(55, 128, 255, 0.5)']}
              style={{ width: '36%', height: 1 }}
            />
          </RowWrapper>

          <SubContainer>
            <Icon name="button-border-color" style={{ position: 'absolute' }} width={width * 0.9} />
            <Button
              title={t('auth:button.newWallet')}
              style={{ width: width * 0.9 }}
              onPress={() => dispatch(resetOnboardingAndNavigateAction(GET_NOTIFICATIONS))}
              transparent
            />
          </SubContainer>

          <SubContainer>
            <Icon name="button-border-color" style={{ position: 'absolute' }} width={width * 0.9} />
            <Button
              title={t('auth:button.recoverWallet')}
              style={{ width: width * 0.9 }}
              onPress={() => dispatch(resetOnboardingAndNavigateAction(IMPORT_WALLET_LEGALS))}
              transparent
            />
          </SubContainer>
        </ScrollView>
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
