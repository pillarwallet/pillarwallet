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
import { Keyboard, SectionList } from 'react-native';
import styled from 'styled-components/native';
import { Container, Wrapper } from 'components/Layout';
import Header from 'components/Header';
import Button from 'components/Button';
import Separator from 'components/Separator';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { Paragraph } from 'components/Typography';
import { baseColors, spacing } from 'utils/variables';
import { RECOVERY_AGENTS, CHOOSE_ASSETS_TO_TRANSFER } from 'constants/navigationConstants';
import { SDK_PROVIDER } from 'react-native-dotenv';

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

// temp
const recoveryAgents = [];
const tokens = [];
const genericToken = require('assets/images/tokens/genericToken.png');

class UpgradeConfirmScreen extends React.PureComponent<Props, State> {
  renderItem = ({ item: asset }: Object) => {
    const {
      symbol,
      name,
      iconUrl,
    } = asset;

    const fullIconUrl = `${SDK_PROVIDER}/${iconUrl}?size=3`;

    return (
      <ListItemWithImage
        label={name}
        subtext={symbol}
        itemImageUrl={fullIconUrl}
        fallbackSource={genericToken}
        small
      />
    );
  };

  render() {
    const { navigation } = this.props;

    const sections = [];
    if (recoveryAgents.length) {
      sections.push({
        title: 'RECOVERY AGENTS',
        routeToUpdate: RECOVERY_AGENTS,
        data: recoveryAgents,
        extraData: [],
      });
    }
    if (tokens.length) {
      sections.push({
        title: 'TOKENS',
        routeToUpdate: CHOOSE_ASSETS_TO_TRANSFER,
        data: tokens,
        extraData: [],
      });
    }

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
              Description here to educate people about deploying the contract.
            </Paragraph>
          </Wrapper>
        </WhiteWrapper>
        <SectionList
          renderItem={this.renderItem}
          sections={sections}
          keyExtractor={(item) => item.symbol}
          style={{ width: '100%' }}
          contentContainerStyle={{
            width: '100%',
          }}
          stickySectionHeadersEnabled={false}
          ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
          onScroll={() => Keyboard.dismiss()}
        />
        <Footer>
          <Button title="Enable Smart Wallet" onPress={() => {}} />
        </Footer>
      </Container>
    );
  }
}

export default UpgradeConfirmScreen;
