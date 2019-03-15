import React, { Component } from 'react';
import { Text } from 'react-native';
import { DrawerActions } from 'react-navigation-drawer';
import { Container, Footer, Wrapper } from 'components/Layout';
import * as styled from './styles';

require('./guidesToLoad');

class Welcome extends Component {
  static navigationOptions = {
    drawerLabel: 'WELCOME',
  };

  openDrawer = () => {
    const { navigation } = this.props;
    navigation.dispatch(DrawerActions.toggleDrawer());
  }

  render() {
    return (
      <Container>
        <Wrapper fullScreen center>
          <styled.Title>hello</styled.Title>
          <styled.Subtitle>Styleguide System</styled.Subtitle>
        </Wrapper>
        <Footer>
          <styled.Note
            onPress={this.openDrawer}
          >
            open the drawer or slide
          </styled.Note>
        </Footer>
      </Container>
    );
  }
};

export default Welcome;
