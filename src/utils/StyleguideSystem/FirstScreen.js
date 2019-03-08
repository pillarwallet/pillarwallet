import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { Container } from 'components/Layout';

class FirstScreen extends Component {
  render() {
    return (
      <Container>
        <Text>this.props.text</Text>
      </Container>
    );
  }
};

export default FirstScreen;

