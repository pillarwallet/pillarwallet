// @flow
import * as React from 'react';
import { Text } from 'react-native';
import { Container, Wrapper } from 'components/Layout';
import { List, ListItem, Body, Right, Icon } from 'native-base';
import Title from 'components/Title';
import tokens from 'utils/erc_whitelist.json';

type Props = {}


export default class AddToken extends React.Component<Props> {
  generateAddTokenListItems() {
    return Object.keys(tokens)
      .map((key) => tokens[key])
      .map((token) => (
        <ListItem>
          <Body>
            <Text>{token.name}</Text>
            <Text>{token.symbol}</Text>
          </Body>
          <Right>
            <Icon name="arrow-forward" />
          </Right>
        </ListItem>
      ));
  }

  render() {
    return (
      <Container>
        <Wrapper padding>
          <Title title="add token" />
          <List>
            {this.generateAddTokenListItems()}
          </List>
        </Wrapper>
      </Container>
    );
  }
}
