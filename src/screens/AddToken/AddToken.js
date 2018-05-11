// @flow
import * as React from 'react';
import { Image } from 'react-native';
import styled from 'styled-components/native';
import { baseColors, fontWeights, fontSizes } from 'utils/variables';
import { Container, Wrapper } from 'components/Layout';
import { List, ListItem, Body, Right, Switch, Thumbnail } from 'native-base';
import Title from 'components/Title';
import tokens from 'utils/erc_whitelist.json';

type Props = {}

const TokenIcons = {
  PLR: require('assets/images/tokens/PLR/icon.png'),
  EOS: require('assets/images/tokens/EOS/icon.png'),
  QTM: require('assets/images/tokens/QTM/icon.png'),
  OMG: require('assets/images/tokens/OMG/icon.png'),
  ICX: require('assets/images/tokens/ICX/icon.png'),
  STORJ: require('assets/images/tokens/STORJ/icon.png'),
  BAT: require('assets/images/tokens/BAT/icon.png'),
  GNT: require('assets/images/tokens/GNT/icon.png'),
  PPT: require('assets/images/tokens/PPT/icon.png'),
  SALT: require('assets/images/tokens/SALT/icon.png'),
};

const TokenName = styled.Text`
  font-size: ${fontSizes.medium};
  font-weight: ${fontWeights.bold};
`;

const TokenSymbol = styled.Text`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.medium};
  font-weight: ${fontWeights.light};
`;

const AddTokenTitle = styled(Title)`
  margin-left: 20px;
`;

const TokenListItem = styled(ListItem)`
  margin-left: 20px;
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
          <Body>
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
        <Wrapper>
          <AddTokenTitle title="add token" />
          <List>
            {this.generateAddTokenListItems()}
          </List>
        </Wrapper>
      </Container>
    );
  }
}
