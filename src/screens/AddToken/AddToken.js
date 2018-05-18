// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { baseColors, fontWeights, fontSizes, UIColors } from 'utils/variables';
import { Container, Wrapper } from 'components/Layout';
import ButtonIcon from 'components/ButtonIcon';
import { Paragraph } from 'components/Typography';
import { List, ListItem, Body, Right, Switch, Thumbnail } from 'native-base';
import Title from 'components/Title';
import tokens from 'utils/erc_whitelist.json';

const tokenIcons = {};

tokenIcons.PLR = require('assets/images/tokens/PLR/icon.png');
tokenIcons.QTM = require('assets/images/tokens/QTM/icon.png');
tokenIcons.OMG = require('assets/images/tokens/OMG/icon.png');
tokenIcons.ICX = require('assets/images/tokens/ICX/icon.png');
tokenIcons.STORJ = require('assets/images/tokens/STORJ/icon.png');
tokenIcons.BAT = require('assets/images/tokens/BAT/icon.png');
tokenIcons.GNT = require('assets/images/tokens/GNT/icon.png');
tokenIcons.PPT = require('assets/images/tokens/PPT/icon.png');
tokenIcons.SALT = require('assets/images/tokens/SALT/icon.png');

const TokenName = styled.Text`
  font-size: ${fontSizes.medium};
  font-weight: ${fontWeights.bold};
`;

const TokenSymbol = styled.Text`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.medium};
  font-weight: ${fontWeights.light};
`;

const TokenListItem = styled(ListItem)`
  margin: 0;
`;

const CloseButton = styled(ButtonIcon)`
  position: absolute;
  right: 5px;
  top: 5px;
  zIndex: 5;
`;

type Props = {
  navigation: NavigationScreenProp<*>,
}

export default class AddToken extends React.Component<Props> {
  generateAddTokenListItems() {
    return tokens.map(({ symbol, name }) => (
      <TokenListItem key={symbol}>
        <Thumbnail square size={80} source={tokenIcons[symbol]} />
        <Body style={{ marginLeft: 20 }}>
          <TokenName>{name}</TokenName>
          <TokenSymbol>{symbol}</TokenSymbol>
        </Body>
        <Right>
          <Switch value={false} />
        </Right>
      </TokenListItem>
    ));
  }

  handleScreenDissmisal = () => {
    const { navigation } = this.props;
    navigation.goBack(null);
  }

  render() {
    return (
      <Container>
        <Wrapper padding>
          <CloseButton
            icon="close"
            onPress={this.handleScreenDissmisal}
            color={UIColors.primary}
            fontSize={42}
          />
          <Title title="add token" />
          <Paragraph>
            Toggle ERC-20 tokens your wallet should display.
          </Paragraph>
          <List>
            {this.generateAddTokenListItems()}
          </List>
        </Wrapper>
      </Container>
    );
  }
}
