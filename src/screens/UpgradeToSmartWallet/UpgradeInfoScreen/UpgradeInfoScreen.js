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
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import Emoji from 'react-native-emoji';
import { Container, Wrapper } from 'components/Layout';
import Header from 'components/Header';
import Button from 'components/Button';
import { Paragraph, BoldText, BaseText } from 'components/Typography';
import { baseColors, fontSizes, spacing } from 'utils/variables';
import { RECOVERY_AGENTS } from 'constants/navigationConstants';

type Props = {
  changePin: (newPin: string, currentPin: string) => Function,
  walletState: ?string,
  navigation: NavigationScreenProp<*>,
  resetIncorrectPassword: () => Function,
};

type State = {
  pinError: string,
};

const WhiteWrapper = styled.View`
  background-color: ${baseColors.white};
  padding-bottom: 50px;
`;

const ExplanationRow = styled.View`
  margin-top: 26px;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
`;

const TextWrapper = styled.View`
  flex-direction: column;
  flex: 1;
`;

const ExplanationTitle = styled(BoldText)`
  font-size: ${fontSizes.medium}px;
  color: ${baseColors.midnight};
`;

const BodyWrapper = styled(BaseText)`
  flex-direction: row;
  flex-wrap: wrap;
`;

const ExplanationBody = styled(BaseText)`
  font-size: ${fontSizes.small}px;
  color: ${baseColors.midnight};
  flex: 1;
`;

const ExplanationEmoji = styled(Emoji)`
  font-size: 40px;
  margin-right: 24px;
  margin-left: 10px;
  color: #000000;
`;

const Footer = styled.View`
  background-color: ${baseColors.snowWhite};
  border-top-width: 1px;
  border-top-color: #ededed;
  flex-direction: row;
  justify-content: flex-end;
  align-items: flex-start;
  padding: ${spacing.large}px ${spacing.mediumLarge}px;
  flex: 1;
`;

class UpgradeInfoScreen extends React.PureComponent<Props, State> {
  render() {
    const { navigation } = this.props;
    return (
      <Container>
        <WhiteWrapper>
          <Header
            title="what's next"
            centerTitle
            onBack={() => navigation.goBack(null)}
          />
          <Wrapper regularPadding>
            <Paragraph small>
              On the following screens you’ll have to choose your recovery agents and funds to transfer to your new
              Smart Wallet.
            </Paragraph>
            <ExplanationRow>
              <ExplanationEmoji name="raising_hand" />
              <TextWrapper>
                <ExplanationTitle>
                  What’s recovery agents?
                </ExplanationTitle>
                <BodyWrapper>
                  <ExplanationBody>
                    It’s one or many of your contacts who posess a part of your key for restoring access to your
                    Smart Wallet, etc.
                  </ExplanationBody>
                </BodyWrapper>
              </TextWrapper>
            </ExplanationRow>
            <ExplanationRow>
              <ExplanationEmoji name="rocket" />
              <TextWrapper>
                <ExplanationTitle>
                  Why transfering funds?
                </ExplanationTitle>
                <BodyWrapper>
                  <ExplanationBody>
                    It’s more safe and it’s more convenient to store your funds in a contract rather than rely on
                    a private key only, etc.
                  </ExplanationBody>
                </BodyWrapper>
              </TextWrapper>
            </ExplanationRow>
          </Wrapper>
        </WhiteWrapper>
        <Footer>
          <Button small title="Next" onPress={() => navigation.navigate(RECOVERY_AGENTS)} />
        </Footer>
      </Container>
    );
  }
}

export default UpgradeInfoScreen;
