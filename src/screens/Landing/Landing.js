// @flow
import * as React from 'react';
import styled from 'styled-components';
import Container from 'components/Container';
import Button from 'components/Button';
import Footer from 'components/Footer';
import AnimatedBackground from './AnimatedBackground';

const pillarLogoSource = require('assets/images/landing-pillar-logo.png');

type Props = {
}

const PillarLogo = styled.Image`
  margin-top: 120;
  height: 60;
  width: 120;
`;


export default class Landing extends React.Component<Props> {
  loginAction = () => {
    // TODO: Login action
  }

  signupAction = () => {
    // TODO: Signup action
  }

  render() {
    return (
    // <Container center>
      <AnimatedBackground>
        <PillarLogo source={pillarLogoSource} />
        <Footer>
          <Button onPress={this.loginAction} title="Login" />
          <Button onPress={this.signupAction} secondary title="Signup" />
        </Footer>
      </AnimatedBackground>
    // </Container>
    );
  }
}
