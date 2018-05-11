// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontWeights, fontSizes } from 'utils/variables';
import { Container, Wrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import { List, ListItem, Body, Right, Switch, Thumbnail } from 'native-base';
import Title from 'components/Title';
import tokens from 'utils/erc_whitelist.json';

type Props = {}


const TokenIcons = {};

TokenIcons.PLR = require('assets/images/tokens/PLR/icon.png');
TokenIcons.QTM = require('assets/images/tokens/QTM/icon.png');
TokenIcons.OMG = require('assets/images/tokens/OMG/icon.png');
TokenIcons.ICX = require('assets/images/tokens/ICX/icon.png');
TokenIcons.STORJ = require('assets/images/tokens/STORJ/icon.png');
TokenIcons.BAT = require('assets/images/tokens/BAT/icon.png');
TokenIcons.GNT = require('assets/images/tokens/GNT/icon.png');
TokenIcons.PPT = require('assets/images/tokens/PPT/icon.png');
TokenIcons.SALT = require('assets/images/tokens/SALT/icon.png');

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


export default class AddToken extends React.Component<Props> {
  getImagePath(symbol: string) {
    return `assets/images/${symbol}/icon.png`;
  }

  generateAddTokenListItems() {
    return Object.keys(tokens)
      .map((key) => tokens[key])
      .map((token) => (
        <TokenListItem>
          <Thumbnail square size={80} source={TokenIcons[token.symbol]} />
          <Body style={{ marginLeft: 20 }}>
            <TokenName>{token.name}</TokenName>
            <TokenSymbol>{token.symbol}</TokenSymbol>
          </Body>
          <Right>
            <Switch value={false} />
          </Right>
        </TokenListItem>
      ));
  }

  render() {
    return (
      <Container>
        <Wrapper padding>
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
