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
import { Platform } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { IMPORT_WALLET_LEGALS } from 'constants/navigationConstants';
import { Container, Footer, Wrapper } from 'components/Layout';
import Button from 'components/Button';
import AnimatedBackground from 'components/AnimatedBackground';
import ButtonText from 'components/ButtonText';
import { fontSizes } from 'utils/variables';
import { navigateToNewWalletPageAction } from 'actions/walletActions';
import { CachedImage } from 'react-native-cached-image';
import { connect } from 'react-redux';
import type { Theme } from 'models/Theme';
import { getThemeType } from 'utils/themes';
import { LIGHT_THEME } from 'constants/appSettingsConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  navigateToNewWalletPage: Function,
  theme: Theme,
}

type State = {
  shouldAnimate: boolean,
}

const pillarLogoSource = require('assets/images/landing-pillar-logo.png');
const pillarLogoSourceDarkMode = require('assets/images/landing-pillar-logo-dark-theme.png');

const PillarLogo = styled(CachedImage)`
  height: 60px;
  width: 120px;
`;

class Welcome extends React.Component<Props, State> {
  listeners: Object[];

  constructor(props: Props) {
    super(props);
    this.listeners = [];
    this.state = {
      shouldAnimate: true,
    };
  }

  componentDidMount() {
    const { navigation } = this.props;

    this.listeners = [
      navigation.addListener('willFocus', () => this.setState({ shouldAnimate: true })),
      navigation.addListener('willBlur', () => this.setState({ shouldAnimate: false })),
    ];
  }

  componentWillUnmount() {
    this.listeners.forEach(listenerItem => listenerItem.remove());
  }

  loginAction = () => {
    this.props.navigateToNewWalletPage();
  };

  navigateToWalletImportPage = () => {
    const { navigation } = this.props;
    navigation.navigate(IMPORT_WALLET_LEGALS);
  };

  render() {
    const { shouldAnimate } = this.state;
    const { theme } = this.props;
    const currentTheme = getThemeType(theme);
    const logoSource = currentTheme === LIGHT_THEME ? pillarLogoSource : pillarLogoSourceDarkMode;
    return (
      <Container>
        <AnimatedBackground
          shouldAnimate={shouldAnimate}
          disabledAnimation={Platform.OS === 'android' && Platform.Version < 24}
        />
        <Wrapper fullScreen center>
          <PillarLogo source={logoSource} />
        </Wrapper>
        <Footer
          style={{ paddingBottom: 30 }}
        >
          <Button roundedCorners marginBottom="20px" onPress={this.loginAction} title="Create account" width="auto" />
          <ButtonText
            buttonText="Restore wallet"
            onPress={this.navigateToWalletImportPage}
            fontSize={fontSizes.big}
          />
        </Footer>
      </Container>
    );
  }
}


const mapDispatchToProps = (dispatch: Function) => ({
  navigateToNewWalletPage: () => {
    dispatch(navigateToNewWalletPageAction());
  },
});

export default withTheme(connect(null, mapDispatchToProps)(Welcome));
