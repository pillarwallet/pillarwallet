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
  listeners: Object[]
}

type State = {
  shouldAnimate: boolean
}

const pillarLogoSource = require('assets/images/landing-pillar-logo.png');

const PillarLogo = styled.Image`
  height: 60;
  width: 120;
`;

class Welcome extends React.Component<Props, State> {
  listeners: Object[];

  constructor(props: Props) {
    super(props);
    this.listeners = [];
  }


  static navigationOptions = {
    header: null,
  };

  state = {
    shouldAnimate: true,
  };

  loginAction = () => {
    this.props.navigation.navigate(ONBOARDING_HOME);
  };

  componentDidMount() {
    this.listeners = [
      this.props.navigation.addListener('willFocus', () => this.setState({ shouldAnimate: true })),
      this.props.navigation.addListener('willBlur', () => this.setState({ shouldAnimate: false })),
    ];
  }

  componentWillUnmount() {
    this.listeners.forEach((listenerItem) => {
      listenerItem.remove();
    });
  }

  render() {
    const { isFetched } = this.props;
    if (!isFetched) return null;
    return (
      <Container center>
        <AnimatedBackground shouldAnimate={this.state.shouldAnimate} />
        <PillarLogo source={pillarLogoSource} />
        <Footer>
          <Button block marginBottom="20px" onPress={this.loginAction} title="Get Started" />
          <HyperLink url="https://pillarproject.io/en/terms-of-use/">Terms and Conditions</HyperLink>
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({ appSettings: { isFetched } }) => ({
  isFetched,
});

export default connect(mapStateToProps)(Welcome);
