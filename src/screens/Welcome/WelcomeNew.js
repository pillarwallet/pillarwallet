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
import Swiper from 'react-native-swiper';
import { IMPORT_WALLET } from 'constants/navigationConstants';
import { Footer } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BoldText, MediumText } from 'components/Typography';
import Button from 'components/Button';
import ButtonText from 'components/ButtonText';
import { fontSizes, baseColors, fontStyles } from 'utils/variables';
import { responsiveSize } from 'utils/ui';
import { navigateToNewWalletPageAction } from 'actions/walletActions';
import { CachedImage } from 'react-native-cached-image';
import { connect } from 'react-redux';

type Props = {
  navigation: NavigationScreenProp<*>,
  navigateToNewWalletPage: Function,
}

const pillarLogoSource = require('assets/images/landing-pillar-logo.png');

const PillarLogo = styled(CachedImage)`
  height: 30px;
  width: 60px;
`;

const Title = styled(BoldText)`
  color: ${baseColors.pomegranate};
  ${fontStyles.rJumbo};
`;

const BodyText = styled(MediumText)`
  color: ${baseColors.pomegranate};
  ${fontStyles.rBig};
  margin-top: ${responsiveSize(26)}px;
`;

const Wrapper = styled.View`
  flex: 1;
  padding: 20px 0;
`;

const Slide = styled.View`
  width: 100%;
  padding: 0 55px 0 46px;
`;

// mockup data
const features = [
  {
    key: 'PPN',
    title: 'Pillar Network',
    bodyText: 'Store your assets in a personal smart contract and ' +
      'control access through an intuitive key management system.',
  },
  {
    key: 'PPN2',
    title: 'Pillar Network',
    bodyText: 'Store your assets in a personal smart contract and ' +
      'control access through an intuitive key management system.',
  },
  {
    key: 'PPN3',
    title: 'Pillar Network',
    bodyText: 'Store your assets in a personal smart contract and ' +
      'control access through an intuitive key management system.',
  },
];

class Welcome extends React.Component<Props> {
  loginAction = () => {
    this.props.navigateToNewWalletPage();
  };

  navigateToWalletImportPage = () => {
    const { navigation } = this.props;
    navigation.navigate(IMPORT_WALLET);
  };

  renderSlides = () => {
    return features.map((feature) => {
      return (
        <Slide key={feature.key}>
          <Title>{feature.title}</Title>
          <BodyText>{feature.bodyText}</BodyText>
        </Slide>
      );
    });
  }

  render() {
    return (
      <ContainerWithHeader
        backgroundColor={baseColors.ultramarine}
        headerProps={{
          floating: true,
          transparent: true,
          noBack: true,
          rightItems: [
            {
              key: 'icon',
              custom: (<PillarLogo source={pillarLogoSource} resizeMethod="resize" resizeMode="contain" />),
            },
          ],
        }}
      >
        <Wrapper>
          <Swiper
            containerStyle={{ width: '100%' }}
            paginationStyle={{ paddingLeft: 46, paddingRight: 55, justifyContent: 'flex-start' }}
            dotColor={baseColors.white}
            activeDotColor={baseColors.pomegranate}
          >
            {this.renderSlides()}
          </Swiper>
        </Wrapper>
        <Footer
          style={{ paddingBottom: 30 }}
        >
          <Button marginBottom="20px" onPress={this.loginAction} title="Create account" width="auto" />
          <ButtonText
            buttonText="Restore wallet"
            onPress={this.navigateToWalletImportPage}
            fontSize={fontSizes.big}
          />
        </Footer>
      </ContainerWithHeader>
    );
  }
}


const mapDispatchToProps = (dispatch: Function) => ({
  navigateToNewWalletPage: () => {
    dispatch(navigateToNewWalletPageAction());
  },
});

export default connect(null, mapDispatchToProps)(Welcome);
