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
import type { NavigationScreenProp } from 'react-navigation';
import { IMPORT_WALLET } from 'constants/navigationConstants';
import { Wrapper, Container, Footer } from 'components/Layout';
import { fontSizes } from 'utils/variables';
import Button from 'components/Button';
import AnimatedBackground from 'components/AnimatedBackground';
import ButtonText from 'components/ButtonText';
import { navigateToNewWalletPageAction } from 'actions/walletActions';
import { CachedImage } from 'react-native-cached-image';
import { connect } from 'react-redux';

type Props = {
  navigation: NavigationScreenProp<*>,
  navigateToNewWalletPage: Function,
}

type State = {
  shouldAnimate: boolean,
}

const pillarLogoSource = require('assets/images/landing-pillar-logo.png');

const PillarLogo = styled(CachedImage)`
  height: 60;
  width: 120;
`;

class Welcome extends React.Component<Props, State> {
  listeners: Object[];

  constructor(props: Props) {
    super(props);
    this.listeners = [];
  }

  state = {
    shouldAnimate: true,
  };

  loginAction = () => {
    this.props.navigateToNewWalletPage();
  };

  navigateToWalletImportPage = () => {
    const { navigation } = this.props;
    navigation.navigate(IMPORT_WALLET);
  };

  componentDidMount() {
    this.listeners = [
      this.props.navigation.addListener('willFocus', () => {
        this.setState({ shouldAnimate: true });
      }),
      this.props.navigation.addListener('willBlur', () => this.setState({ shouldAnimate: false })),
    ];
  }

  componentWillUnmount() {
    this.listeners.forEach((listenerItem) => {
      listenerItem.remove();
    });
  }

  render() {
    return (
      <Container>
        <AnimatedBackground shouldAnimate={this.state.shouldAnimate} />
        <Wrapper fullScreen center>
          <PillarLogo source={pillarLogoSource} />
        </Wrapper>
        <Footer>
          <Button block marginBottom="20px" onPress={this.loginAction} title="New wallet" />
          <ButtonText
            buttonText="Restore wallet"
            onPress={this.navigateToWalletImportPage}
            fontSize={fontSizes.medium}
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

export default connect(null, mapDispatchToProps)(Welcome);
