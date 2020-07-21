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
import type { NavigationScreenProp } from 'react-navigation';
import { CachedImage } from 'react-native-cached-image';
import { connect } from 'react-redux';
import t from 'translations/translate';

import { Wrapper } from 'components/Layout';
import Button from 'components/Button';
import ButtonText from 'components/ButtonText';

import { fontSizes, spacing } from 'utils/variables';
import { images } from 'utils/images';
import { getDeviceWidth } from 'utils/common';

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


const screenWidth = getDeviceWidth();

const Background = styled.View`
  flex: 1;
  background-color: #00ff24;
  width: 100%;
`;

const Pattern = styled(CachedImage)`
  width: 100%;
  height: ${({ height }) => height}px;
`;

const PillarLogo = styled(CachedImage)`
  height: 56px;
  width: 192px;
`;

const LogoWrapper = styled.View`
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

const IMAGE_RATIO = 270 / 375;

class Welcome extends React.PureComponent<Props> {
  loginAction = () => {
    this.props.navigateToNewWalletPage();
  };

  navigateToWalletImportPage = () => {
    const { navigation } = this.props;
    navigation.navigate(IMPORT_WALLET_LEGALS);
  };

  render() {
    const { theme } = this.props;
    const { pillarLogo, landingPattern } = images(theme);

    return (
      <Background>
        <Pattern source={landingPattern} resizeMode="cover" height={2 + (screenWidth * IMAGE_RATIO)} />
        <ContainerWithHeader
          backgroundColor="transparent"
          statusbarColor={{
            [LIGHT_THEME]: LIGHT_CONTENT,
          }}
        >
          <Wrapper fullScreen center>
            <LogoWrapper>
              <PillarLogo source={pillarLogo} />
            </LogoWrapper>
            <ButtonsWrapper>
              <Button
                roundedCorners
                marginBottom={spacing.mediumLarge}
                onPress={this.loginAction}
                title={t('auth:button.createAccount')}
                style={{ backgroundColor: '#000000' }}
                block
              />
              <ButtonText
                buttonText={t('auth:button.recoverWallet')}
                onPress={this.navigateToWalletImportPage}
                fontSize={fontSizes.big}
                textStyle={{ color: '#0a1427' }}
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
