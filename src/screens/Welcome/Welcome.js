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

import React, { useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { useDispatch } from 'react-redux';
import styled, { ThemeProvider } from 'styled-components/native';
import t from 'translations/translate';
import { switchEnvironments } from 'configs/envConfig';

// actions
import { resetOnboardingAndNavigateAction } from 'actions/onboardingActions';

// components
import { Wrapper } from 'components/legacy/Layout';
import Image from 'components/Image';
import Button from 'components/legacy/Button';
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';

// utils
import { spacing } from 'utils/variables';
import { images } from 'utils/images';
import { getThemeByType } from 'utils/themes';

// constants
import { IMPORT_WALLET_LEGALS, NEW_PROFILE } from 'constants/navigationConstants';
import { LIGHT_CONTENT, LIGHT_THEME, DARK_THEME } from 'constants/appSettingsConstants';

const LOGO_HEIGHT = 56;
const INITIAL_TOP_MARGIN = LOGO_HEIGHT / 2;

const translateY = new Animated.Value(0);

let clickCount = 0;
const handleSecretClick = () => {
  clickCount++;
  if (clickCount === 16) {
    // on the 16th click switch network and reset.
    clickCount = 0;
    switchEnvironments();
  }
};

const Welcome = () => {
  const darkTheme = getThemeByType(DARK_THEME);

  const dispatch = useDispatch();

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: -20,
      easing: Easing.elastic(1),
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, []);

  const { pillarLogo, landingPattern } = images(darkTheme);

  return (
    <ThemeProvider theme={darkTheme}>
      <Background>
        <AnimatedLogoWrapper style={{ transform: [{ translateY }] }}>
          <PillarLogo source={pillarLogo} />
        </AnimatedLogoWrapper>
        <Pattern source={landingPattern} />
        <ContainerWithHeader backgroundColor="transparent" statusbarColor={{ [LIGHT_THEME]: LIGHT_CONTENT }}>
          <Wrapper fullScreen>
            <Spacer onPress={handleSecretClick} />

            <ButtonsWrapper>
              <Button
                title={t('auth:button.createAccount')}
                onPress={() => dispatch(resetOnboardingAndNavigateAction(NEW_PROFILE))}
                marginBottom={4}
              />
              <Button
                title={t('auth:button.recoverWallet')}
                onPress={() => dispatch(resetOnboardingAndNavigateAction(IMPORT_WALLET_LEGALS))}
                transparent
              />
            </ButtonsWrapper>
          </Wrapper>
        </ContainerWithHeader>
      </Background>
    </ThemeProvider>
  );
};

export default Welcome;

const Background = styled.View`
  background-color: #1a1a1a;
  width: 100%;
  height: 100%;
  position: relative;
`;

const Pattern = styled(Image)`
  width: 216px;
  height: 162px;
`;

const PillarLogo = styled(Image)`
  height: ${LOGO_HEIGHT}px;
  width: 192px;
`;

const LogoWrapper = styled.View`
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  align-items: center;
  margin-top: -${INITIAL_TOP_MARGIN}px;
`;

const Spacer = styled.TouchableOpacity`
  flex: 2.5;
  width: 100%;
  align-items: center;
  justify-content: center;
`;

const ButtonsWrapper = styled.View`
  flex: 2;
  width: 100%;
  padding: 30px ${spacing.layoutSides}px;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
`;

const AnimatedLogoWrapper = Animated.createAnimatedComponent(LogoWrapper);
