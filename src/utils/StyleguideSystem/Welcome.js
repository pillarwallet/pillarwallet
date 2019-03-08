import React, { Component } from 'react';
import { Text } from 'react-native';
import { Container, Footer, Wrapper } from 'components/Layout';
import * as styled from './styles';

require('./guidesToLoad');

class Welcome extends Component {
  static navigationOptions = {
    drawerLabel: 'WELCOME',
  };

  render() {
    return (
      <Container>
        <Wrapper fullScreen center>
          <styled.Title>hello</styled.Title>
          <styled.Subtitle>Styleguide System</styled.Subtitle>
        </Wrapper>
        <Footer>
          <styled.Note>open the drawer on your left</styled.Note>
        </Footer>
      </Container>
    );
  }
};

export default Welcome;
