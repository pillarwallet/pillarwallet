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
import { Animated, Easing } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { CachedImage } from 'react-native-cached-image';
import { connect } from 'react-redux';
import t from 'translations/translate';
import { switchEnvironments } from 'configs/envConfig';

import { Wrapper } from 'components/Layout';
import Button from 'components/Button';
import ButtonText from 'components/ButtonText';

import { fontSizes, spacing } from 'utils/variables';
import { images } from 'utils/images';

import { IMPORT_WALLET_LEGALS } from 'constants/navigationConstants';
import { navigateToNewWalletPageAction } from 'actions/walletActions';
import type { Theme } from 'models/Theme';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { LIGHT_CONTENT, LIGHT_THEME } from 'constants/appSettingsConstants';


type Props = {
  navigation: NavigationScreenProp<*>,
  navigateToNewWalletPage: Function,
  theme: Theme,
};

type State = {
  translateY: Animated.Value,
  clickCount: number,
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

class Welcome extends React.Component<Props, State> {
  state = {
    translateY: new Animated.Value(0),
    clickCount: 0,
  };

  handleClick = () => {
    const newCount = this.state.clickCount + 1;
    this.setState({ clickCount: newCount });
    if (newCount === 16) { // on the 16th click switch network and reset.
      switchEnvironments();
    }
  };

  loginAction = () => {
    this.props.navigateToNewWalletPage();
  };

  animatePositioning = () => {
    Animated.timing(
      this.state.translateY,
      {
        toValue: -20,
        easing: Easing.elastic(1),
        duration: 2000,
        userNativeDriver: true,
      },
    ).start();
  };

  componentDidMount() {
    this.animatePositioning();
  }

  navigateToWalletImportPage = () => {
    const { navigation } = this.props;
    navigation.navigate(IMPORT_WALLET_LEGALS);
  };

  render() {
    const { theme } = this.props;
    const { translateY } = this.state;
    const { pillarLogo, landingPattern } = images(theme);

    return (
      <Background>
        <AnimatedLogoWrapper style={{ transform: [{ translateY }] }}>
          <PillarLogo source={pillarLogo} />
        </AnimatedLogoWrapper>
        <Pattern source={landingPattern} />
        <ContainerWithHeader
          backgroundColor="transparent"
          statusbarColor={{
            [LIGHT_THEME]: LIGHT_CONTENT,
          }}
        >
          <Wrapper fullScreen>
            <Spacer onPress={this.handleClick} />
            <ButtonsWrapper>
              <Button
                roundedCorners
                marginBottom={spacing.mediumLarge}
                onPress={this.loginAction}
                title={t('auth:button.createAccount')}
                style={{ backgroundColor: '#00ff24' }}
                textStyle={{ color: '#000000' }}
                block
              />
              <ButtonText
                buttonText={t('auth:button.recoverWallet')}
                onPress={this.navigateToWalletImportPage}
                fontSize={fontSizes.big}
                textStyle={{ color: '#fcfdff' }}
              />
            </ButtonsWrapper>
          </Wrapper>
        </ContainerWithHeader>
      </Background>
    );
  }
}


const mapDispatchToProps = (dispatch: Function) => ({
  navigateToNewWalletPage: () => {
    dispatch(navigateToNewWalletPageAction());
  },
});

export default withTheme(connect(null, mapDispatchToProps)(Welcome));
