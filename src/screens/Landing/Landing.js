// @flow
import * as React from 'react';
import { Image } from 'react-native';
import styled from 'styled-components';
import Container from 'components/Container';
import Button from 'components/Button';
import Footer from 'components/Footer';

const pillarLogoSource = require('assets/images/landing-pillar-logo.png');

type Props = {
}

const PillarLogo = styled.Image`
  margin-top: 120;
  height: 60;
  width: 120;
`;

loginAction() {
    // TODO: Login action
}

signupAction() {
    // TODO: Signup action
}

export default class Landing extends React.Component<Props> {
  render() {
    return (
      <Container center>
        <PillarLogo source={pillarLogoSource} />
        <Footer>
          <Button onPress={this.loginAction()} title="Login" />
          <Button onPress={this.signupAction()} secondary title="Signup" />
        </Footer>
      </Container>
    );
  }
}
