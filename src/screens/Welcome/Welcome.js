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
import styled, { withTheme } from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import { connect } from 'react-redux';
import t from 'translations/translate';
import { switchEnvironments } from 'configs/envConfig';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { navigateToNewWalletPageAction } from 'actions/walletActions';

// components
import { Wrapper } from 'components/Layout';
import Button from 'components/Button';
import ButtonText from 'components/ButtonText';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';

// utils
import { fontSizes, spacing } from 'utils/variables';
import { images } from 'utils/images';

// constants
import { IMPORT_WALLET_LEGALS } from 'constants/navigationConstants';
import { LIGHT_CONTENT, LIGHT_THEME } from 'constants/appSettingsConstants';

// types
import type { Theme } from 'models/Theme';
import type { Dispatch } from 'reducers/rootReducer';


type Props = {
  navigation: NavigationScreenProp<*>,
  navigateToNewWalletPage: () => void,
  theme: Theme,
};

const LOGO_HEIGHT = 56;
const INITIAL_TOP_MARGIN = LOGO_HEIGHT / 2;

const Background = styled.View`
  background-color: #1a1a1a;
  width: 100%;
  height: 100%;
  position: relative;
`;

const Pattern = styled(CachedImage)`
  width: 216px;
  height: 162px;
`;

const PillarLogo = styled(CachedImage)`
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

const translateY = new Animated.Value(0);

let clickCount = 0;
const handleSecretClick = () => {
  clickCount++;
  console.log('clickCount: ', clickCount)
  if (clickCount === 16) { // on the 16th click switch network and reset.
    clickCount = 0;
    switchEnvironments();
  }
};

const Welcome = ({
  navigation,
  navigateToNewWalletPage,
  theme,
}: Props) => {
  useEffect(() => {
    Animated.timing(translateY, {
      toValue: -20,
      easing: Easing.elastic(1),
      duration: 2000,
      userNativeDriver: true,
    }).start();
  }, []);

  const { pillarLogo, landingPattern } = images(theme);

  return (
    <Background>
      <AnimatedLogoWrapper style={{ transform: [{ translateY }] }}>
        <PillarLogo source={pillarLogo} />
      </AnimatedLogoWrapper>
      <Pattern source={landingPattern} />
      <ContainerWithHeader
        backgroundColor="transparent"
        statusbarColor={{ [LIGHT_THEME]: LIGHT_CONTENT }}
      >
        <Wrapper fullScreen>
          <Spacer onPress={handleSecretClick} />
          <ButtonsWrapper>
            <Button
              roundedCorners
              marginBottom={spacing.mediumLarge}
              onPress={navigateToNewWalletPage}
              title={t('auth:button.createAccount')}
              style={{ backgroundColor: '#00ff24' }}
              textStyle={{ color: '#000000' }}
              block
            />
            <ButtonText
              buttonText={t('auth:button.recoverWallet')}
              onPress={() => navigation.navigate(IMPORT_WALLET_LEGALS)}
              fontSize={fontSizes.big}
              textStyle={{ color: '#fcfdff' }}
            />
          </ButtonsWrapper>
        </Wrapper>
      </ContainerWithHeader>
    </Background>
  );
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  navigateToNewWalletPage: () => dispatch(navigateToNewWalletPageAction()),
});

export default withTheme(connect(null, mapDispatchToProps)(Welcome));
