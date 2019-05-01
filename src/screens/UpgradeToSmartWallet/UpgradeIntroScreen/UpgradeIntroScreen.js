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
import { ImageBackground } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import Emoji from 'react-native-emoji';
import { UPGRADE_INFO } from 'constants/navigationConstants';
import { Container, ScrollWrapper } from 'components/Layout';
import { BoldText, BaseText } from 'components/Typography';
import Button from 'components/Button';
import Header from 'components/Header';
import { baseColors, fontSizes } from 'utils/variables';

type Props = {
  navigation: NavigationScreenProp<*>,
};

const Title = styled(BoldText)`
  font-size: 24px;
  text-align: center;
  color: ${baseColors.midnight};
  margin-top: 30px;
`;

const IntroImage = styled(CachedImage)`
  height: 137;
  width: 88;
`;

const FeaturesWrapper = styled.View`
  width: 100%;
  margin-top: 40px;
  padding: 40px 0;
  border-top-width: 1px;
  border-top-color: #829cd6;
`;

const FeatureRow = styled.View`
  margin-bottom: 16px;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
`;

const FeatureTextWrapper = styled.View`
  flex-direction: column;
`;

const FeatureLabel = styled(BoldText)`
  font-size: ${fontSizes.small}px;
  color: ${baseColors.midnight};
`;

const FeatureBody = styled(BaseText)`
  font-size: ${fontSizes.small}px;
  color: ${baseColors.midnight};
  opacity: 0.6;
`;

const UpgradeEmoji = styled(Emoji)`
  font-size: 30px;
  margin-right: 19px;
  color: #000000;
`;

const headSculptureSource = require('assets/images/headSculpture.png');
const backgroundImageSource = require('assets/images/smartWalletBgGradient.png');

class UpgradeIntroScreen extends React.PureComponent<Props> {
  render() {
    const { navigation } = this.props;
    return (
      <ImageBackground source={backgroundImageSource} style={{ width: '100%', height: '100%' }}>
        <Container color="transparent">
          <Header
            onBack={() => navigation.goBack(null)}
            nextText="Get help"
            onNextPress={() => {}}
          />
          <ScrollWrapper
            contentContainerStyle={{
              alignItems: 'center',
              paddingHorizontal: 30,
              paddingBottom: 5,
            }}
          >
            <IntroImage source={headSculptureSource} />
            <Title>
              Upgrade for unlimited possibilities
            </Title>
            <FeaturesWrapper>
              <FeatureRow>
                <UpgradeEmoji name="v" />
                <FeatureTextWrapper>
                  <FeatureLabel>
                    Multiple accounts & personas
                  </FeatureLabel>
                  <FeatureBody>
                    A path to sovereign identity
                  </FeatureBody>
                </FeatureTextWrapper>
              </FeatureRow>
              <FeatureRow>
                <UpgradeEmoji name="sunglasses" />
                <FeatureTextWrapper>
                  <FeatureLabel>
                    Extra security
                  </FeatureLabel>
                  <FeatureBody>
                    Lost wallet can now be restored
                  </FeatureBody>
                </FeatureTextWrapper>
              </FeatureRow>
              <FeatureRow>
                <UpgradeEmoji name="innocent" />
                <FeatureTextWrapper>
                  <FeatureLabel>
                    Advanced features
                  </FeatureLabel>
                  <FeatureBody>
                    Pillar wallet is not a regular wallet
                  </FeatureBody>
                </FeatureTextWrapper>
              </FeatureRow>
            </FeaturesWrapper>
            <Button block title="Continue" onPress={() => this.props.navigation.navigate(UPGRADE_INFO)} />
          </ScrollWrapper>
        </Container>
      </ImageBackground>
    );
  }
}

export default UpgradeIntroScreen;
