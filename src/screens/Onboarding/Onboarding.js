// @flow
import * as React from 'react';

import type { NavigationScreenProp } from 'react-navigation';
import { BACKUP_PHRASE, IMPORT_WALLET } from 'constants/navigationConstants';
import { Container } from 'components/Layout';
import { Title, Body, BodyLight, HelpText } from 'components/Typography';
import Button from 'components/Button';
import Wrapper from 'components/Wrapper';
import Footer from 'components/Footer';
import HelpTextDivider from 'components/HelpTextDivider';

// const pillarLogoSource = require('assets/images/landing-pillar-logo.png');

// const PillarLogo = styled.Image`
//   height: 60;
//   width: 120;
// `;

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
      <Container>
        <Wrapper padding>
          <Title>wallet</Title>
          <Body>Welcome to the Pillar Wallet! Pillar is a next-generation digital wallet
            and application for personal data management. Your unique invitation code
            allows you to participate in exlusive ICO offerings.
          </Body>
          <BodyLight>Please keep in mind that Pillar does not
            store any personal information other than what
            was provided for verification purposes.
          </BodyLight>
        </Wrapper>
        <Footer>
          <Body>How would you like to use the Pillar Wallet?</Body>
          <Button marginBottom marginTop onPress={this.createNewWallet} title="Setup new wallet" />
          <HelpTextDivider title="or" />
          <Button onPress={this.importOldWallet} secondary title="Restore from existing" />
          <HelpText>Requires 12 word backup phrase or Private Key</HelpText>
        </Footer>
      </Container>
    );
  }
}
export default Onboarding;
