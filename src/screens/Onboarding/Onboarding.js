// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { BACKUP_PHRASE, IMPORT_WALLET } from 'constants/navigationConstants';
import { Container } from 'components/Layout';
import Footer from 'components/Footer';
import Button from 'components/Button';
import AnimatedBackground from 'components/AnimatedBackground';

const pillarLogoSource = require('assets/images/landing-pillar-logo.png');

const PillarLogo = styled.Image`
  height: 60;
  width: 120;
`;

type Props = {
  navigation: NavigationScreenProp<*>,
};

class Onboarding extends React.Component<Props> {
  createNewWallet = () => {
    this.props.navigation.navigate(BACKUP_PHRASE);
  };

  importOldWallet = () => {
    this.props.navigation.navigate(IMPORT_WALLET);
  };

  render() {
    return (
      <Container center>
        <AnimatedBackground />
        <PillarLogo source={pillarLogoSource} />
        <Footer>
          <Button onPress={this.createNewWallet} title="Create new wallet" />
          <Button marginBottom onPress={this.importOldWallet} secondary title="Import old wallet" />
        </Footer>
      </Container>
    );
  }
}
export default Onboarding;
