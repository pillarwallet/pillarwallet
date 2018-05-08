// @flow
import * as React from 'react';

import type { NavigationScreenProp } from 'react-navigation';
import { BACKUP_PHRASE, IMPORT_WALLET } from 'constants/navigationConstants';
import { Container, Footer } from 'components/Layout';
import Title from 'components/Title';
import { Body, BodyLight, HelpText } from 'components/Typography';
import Button from 'components/Button';
import Wrapper from 'components/Wrapper';
import HelpTextDivider from 'components/HelpTextDivider';

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
          <Title title="wallet" />
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
          <Button marginBottom="20px" marginTop="20px" onPress={this.createNewWallet} title="Setup new wallet" />
          <HelpTextDivider title="or" />
          <Button onPress={this.importOldWallet} secondary title="Restore from existing" />
          <HelpText>Requires 12 word backup phrase or Private Key</HelpText>
        </Footer>
      </Container>
    );
  }
}
export default Onboarding;
