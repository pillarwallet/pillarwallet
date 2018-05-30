// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { ONBOARDING_HOME } from 'constants/navigationConstants';
import HyperLink from 'components/HyperLink';
import { Container, Footer } from 'components/Layout';
import Button from 'components/Button';
import AnimatedBackground from 'components/AnimatedBackground';

type Props = {
  navigation: NavigationScreenProp<*>,
  isFetched: boolean,
  OTP: boolean | number,
}

const pillarLogoSource = require('assets/images/landing-pillar-logo.png');

const PillarLogo = styled.Image`
  height: 60;
  width: 120;
`;

class Welcome extends React.Component<Props> {
  static navigationOptions = {
    header: null,
  }
  loginAction = () => {
    this.props.navigation.navigate(ONBOARDING_HOME);
  };

  render() {
    const { isFetched, OTP } = this.props;
    if (!isFetched || OTP) return null;
    return (
      <Container center>
        <AnimatedBackground />
        <PillarLogo source={pillarLogoSource} />
        <Footer>
          <Button block marginBottom="20px" onPress={this.loginAction} title="Get Started" />
          <HyperLink url="https://pillarproject.io/en/terms-of-use/">Terms and Conditions</HyperLink>
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({ appSettings: { isFetched, data: { OTP } } }) => ({
  isFetched,
  OTP,
});

export default connect(mapStateToProps)(Welcome);
