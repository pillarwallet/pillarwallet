// @flow
import * as React from 'react';

import type { NavigationScreenProp } from 'react-navigation';
import { BACKUP_PHRASE, IMPORT_WALLET } from 'constants/navigationConstants';
import { Container, Wrapper, Footer } from 'components/Layout';
import Title from 'components/Title';
import { Paragraph, HelpText } from 'components/Typography';
import Button from 'components/Button';
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
          <Paragraph>Welcome to the Pillar Wallet! Pillar is a next-generation digital wallet
            and application for personal data management. Your unique invitation code
            allows you to participate in exlusive ICO offerings.
          </Paragraph>
          <Paragraph light>Please keep in mind that Pillar does not
            store any personal information other than what
            was provided for verification purposes.
          </Paragraph>
        </Wrapper>
        <Footer>
          <Paragraph>How would you like to use the Pillar Wallet?</Paragraph>
          <Button marginBottom="20px" marginTop="20px" onPress={this.createNewWallet} title="Setup new wallet" />
          <HelpTextDivider title="or" />
          <Button onPress={this.importOldWallet} secondary title="Import existing wallet" />
          <HelpText>Requires 12 word backup phrase or Private Key</HelpText>
        </Footer>
      </Container>
    );
  }
}
export default Onboarding;
