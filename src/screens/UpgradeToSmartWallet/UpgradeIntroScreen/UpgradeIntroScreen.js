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
import { BackHandler, ImageBackground, Platform } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import Emoji from 'react-native-emoji';
import Intercom from 'react-native-intercom';
import { UPGRADE_INFO } from 'constants/navigationConstants';
import { dismissSmartWalletUpgradeAction } from 'actions/smartWalletActions';
import { Container, ScrollWrapper } from 'components/Layout';
import { MediumText, BaseText } from 'components/Typography';
import Button from 'components/Button';
import Header from 'components/Header';
import { baseColors, fontSizes, fontStyles } from 'utils/variables';

type Props = {
  navigation: NavigationScreenProp<*>,
  smartWalletUpgradeDismissed: boolean,
  dismissSmartWalletUpgrade: Function,
};

const Title = styled(MediumText)`
  ${fontStyles.medium};
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
  padding: 30px 0 20px 0;
  border-top-width: 1px;
  border-top-color: #829cd6;
`;

const FeatureRow = styled.View`
  margin-bottom: 16px;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
`;

const FeatureTextWrapper = styled.View`
  flex-direction: column;
  flex: 1;
`;

const FeatureLabel = styled(MediumText)`
  ${fontStyles.medium};
  color: ${baseColors.midnight};
`;

const FeatureBody = styled(BaseText)`
  ${fontStyles.medium};
  color: ${baseColors.midnight};
  opacity: 0.6;
  flex: 1;
`;

const BodyWrapper = styled(BaseText)`
  flex-direction: row;
  flex-wrap: wrap;
`;

const UpgradeEmoji = styled(Emoji)`
  font-size: 30px;
  margin-right: 19px;
  color: #000000;
`;

const StyledButton = styled(Button)`
  margin-bottom: 40px;
`;

const headSculptureSource = require('assets/images/headSculpture.png');
const backgroundImageSource = require('assets/images/smartWalletBgGradient.png');

class UpgradeIntroScreen extends React.PureComponent<Props> {
  onBack = async () => {
    const {
      navigation,
      dismissSmartWalletUpgrade,
      smartWalletUpgradeDismissed,
    } = this.props;
    if (!smartWalletUpgradeDismissed) await dismissSmartWalletUpgrade();
    navigation.goBack(null);
  };

  componentDidMount() {
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', this.onBack);
    }
  }

  componentWillUnmount() {
    if (Platform.OS === 'android') {
      BackHandler.removeEventListener('hardwareBackPress', this.onBack);
    }
  }

  render() {
    return (
      <ImageBackground source={backgroundImageSource} style={{ width: '100%', height: '100%' }}>
        <Container color="transparent">
          <Header
            onBack={this.onBack}
            nextText="Support"
            nextTextStyle={{
              color: baseColors.white,
              fontSize: fontSizes.regular,
              letterSpacing: 0.1,
              opacity: 0.8,
            }}
            onNextPress={() => Intercom.displayMessenger()}
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
                    Many keys, one account
                  </FeatureLabel>
                  <BodyWrapper>
                    <FeatureBody>
                      Store your assets in personal smart contract and control access through an intuitive key
                      management system.
                    </FeatureBody>
                  </BodyWrapper>
                </FeatureTextWrapper>
              </FeatureRow>
              <FeatureRow>
                <UpgradeEmoji name="sunglasses" />
                <FeatureTextWrapper>
                  <FeatureLabel>
                    Improved security
                  </FeatureLabel>
                  <BodyWrapper>
                    <FeatureBody>
                      Recovery agents provide a way to recover your account and assets even in a case of lost device.
                    </FeatureBody>
                  </BodyWrapper>
                </FeatureTextWrapper>
              </FeatureRow>
              <FeatureRow>
                <UpgradeEmoji name="innocent" />
                <FeatureTextWrapper>
                  <FeatureLabel>
                    Advanced features
                  </FeatureLabel>
                  <BodyWrapper>
                    <FeatureBody>
                      Ability to enable multi-signature access, set spending limits, restrict access by persona
                      and/or device and more.
                    </FeatureBody>
                  </BodyWrapper>
                </FeatureTextWrapper>
              </FeatureRow>
              <FeatureRow>
                <UpgradeEmoji name="raising_hand" />
                <FeatureTextWrapper>
                  <FeatureLabel>
                    Multiple personas
                  </FeatureLabel>
                  <BodyWrapper>
                    <FeatureBody>
                      Create separate, independent personas to manage contacts, chats and personal information providing
                      for contextualized identity.
                    </FeatureBody>
                  </BodyWrapper>
                </FeatureTextWrapper>
              </FeatureRow>
            </FeaturesWrapper>
            <StyledButton block title="Continue" onPress={() => this.props.navigation.navigate(UPGRADE_INFO)} />
          </ScrollWrapper>
        </Container>
      </ImageBackground>
    );
  }
}

const mapStateToProps = ({
  smartWallet: { upgradeDismissed: smartWalletUpgradeDismissed },
}) => ({
  smartWalletUpgradeDismissed,
});

const mapDispatchToProps = (dispatch) => ({
  dismissSmartWalletUpgrade: () => dispatch(dismissSmartWalletUpgradeAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(UpgradeIntroScreen);
