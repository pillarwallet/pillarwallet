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
import { Container, Wrapper, ScrollWrapper } from 'components/Layout';
import Header from 'components/Header';
import Button from 'components/Button';
import { Paragraph, MediumText, BaseText } from 'components/Typography';
import { baseColors, fontStyles, spacing } from 'utils/variables';
import { RECOVERY_AGENTS } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
};

const WhiteWrapper = styled.View`
  background-color: ${baseColors.white};
  border-bottom-width: 1px;
  border-bottom-color: #ededed;
  padding-bottom: 18px;
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

const ExplanationTitle = styled(MediumText)`
  ${fontStyles.big};
  color: #222e44;
`;

const BodyWrapper = styled(BaseText)`
  flex-direction: row;
  flex-wrap: wrap;
`;

const ExplanationBody = styled(BaseText)`
  ${fontStyles.medium};
  color: #222e44;
  flex: 1;
`;

const ExplanationEmoji = styled(Emoji)`
  font-size: 32px;
  margin-right: 24px;
  margin-left: 10px;
  color: #000000;
`;

const Footer = styled.View`
  background-color: ${baseColors.surface};
  flex-direction: row;
  justify-content: flex-end;
  align-items: flex-start;
  padding: ${spacing.large}px ${spacing.mediumLarge}px;
  flex: 1;
  margin-top: 24px;
`;

const StyledParagraph = styled(Paragraph)`
  margin-top: 6px;
`;

class UpgradeInfoScreen extends React.PureComponent<Props> {
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
            <StyledParagraph small>
              On the following screens, you will be asked to choose your recovery agents, as well as transfer assets
              to your new Smart Wallet.
            </StyledParagraph>
          </Wrapper>
        </WhiteWrapper>
        <ScrollWrapper regularPadding>
          <ExplanationRow>
            <ExplanationEmoji name="raising_hand" />
            <TextWrapper>
              <ExplanationTitle>
                What are recovery agents?
              </ExplanationTitle>
              <BodyWrapper>
                <ExplanationBody>
                  Recovery Agents are individuals, services and/or secondary devices (e.g. handware wallets) that you
                  choose to assist you with recovering access to your Smart Wallet if you happen to lose your device
                  or master key.
                </ExplanationBody>
              </BodyWrapper>
            </TextWrapper>
          </ExplanationRow>
          <ExplanationRow>
            <ExplanationEmoji name="rocket" />
            <TextWrapper>
              <ExplanationTitle>
                Why do I need to transfer assets?
              </ExplanationTitle>
              <BodyWrapper>
                <ExplanationBody>
                  In order to take advantage of your new Smart Wallet, you will need to transfer your assets to the
                  new account. Due to the enhanced functionality and security benefits storing assets in your
                  Smart Wallet is safer and more convenient than keeping them stored on your private key.
                </ExplanationBody>
              </BodyWrapper>
            </TextWrapper>
          </ExplanationRow>
          <Footer>
            <Button small title="Next" onPress={() => navigation.navigate(RECOVERY_AGENTS)} />
          </Footer>
        </ScrollWrapper>
      </Container>
    );
  }
}

export default UpgradeInfoScreen;
