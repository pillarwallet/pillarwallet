// @flow
import * as React from 'react';
import { Linking } from 'react-native';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { SIGN_IN } from 'constants/navigationConstants';
import { Container, Footer } from 'components/Layout';
import Button from 'components/Button';
import HelpTextDivider from 'components/HelpTextDivider';
import AnimatedBackground from 'components/AnimatedBackground';

type Props = {
  navigation: NavigationScreenProp<*>,
}

const pillarLogoSource = require('assets/images/landing-pillar-logo.png');

const PillarLogo = styled.Image`
  height: 60;
  width: 120;
`;

export default class Welcome extends React.Component<Props> {
  loginAction = () => {
    this.props.navigation.navigate(SIGN_IN);
  };

  signupAction = () => {
    // TODO: Signup action
  };

  viewTermsAndConditions = () => {
    Linking.openURL('https://pillarproject.io/en/terms-of-use/');
  };

  render() {
    return (
      <Container center>
        <AnimatedBackground />
        <PillarLogo source={pillarLogoSource} />
        <Footer>
          <Button block marginBottom onPress={this.loginAction} title="Login" />
          <HelpTextDivider title="Don&#39;t have an account?" />
          <Button onPress={this.signupAction} secondary title="Signup" />
          <Button marginTop secondary small onPress={this.viewTermsAndConditions} title="Terms and Conditions" />
        </Footer>
      </Container>
    );
  }
}
