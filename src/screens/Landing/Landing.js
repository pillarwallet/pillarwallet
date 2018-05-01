// @flow
import * as React from 'react';
import styled from 'styled-components';
import type { NavigationScreenProp } from 'react-navigation';
import { LOGIN } from 'constants/navigationConstants';
import { Container } from 'components/Layout';
import Button from 'components/Button';
import Footer from 'components/Footer';
import AnimatedBackground from './AnimatedBackground';

type Props = {
  navigation: NavigationScreenProp<*>,
}

const pillarLogoSource = require('assets/images/landing-pillar-logo.png');

const PillarLogo = styled.Image`
  margin-top: 120;
  height: 60;
  width: 120;
`;


export default class Landing extends React.Component<Props> {
  loginAction = () => {
    this.props.navigation.navigate(LOGIN);
  };

  signupAction = () => {
    // TODO: Signup action
  };

  render() {
    return (
      <Container center>
        <AnimatedBackground />

        <PillarLogo source={pillarLogoSource} />
        <Footer>
          <Button onPress={this.loginAction} title="Login" />
          <Button marginBottom onPress={this.signupAction} secondary title="Signup" />
        </Footer>
      </Container>
    );
  }
}
