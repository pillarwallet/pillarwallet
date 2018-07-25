// @flow
import * as React from 'react';

import type { NavigationScreenProp } from 'react-navigation';
import { SECURITY_CONFIRM, IMPORT_WALLET } from 'constants/navigationConstants';
import { Container, Wrapper, Footer } from 'components/Layout';
import Header from 'components/Header';
import { Paragraph } from 'components/Typography';
import Button from 'components/Button';

type Props = {
  navigation: NavigationScreenProp<*>,
};

class Onboarding extends React.Component<Props> {
  createNewWallet = () => {
    this.props.navigation.navigate(SECURITY_CONFIRM);
  };

  importOldWallet = () => {
    this.props.navigation.navigate(IMPORT_WALLET);
  };

  render() {
    return (
      <Container>
        <Header title="welcome" onBack={() => this.props.navigation.goBack(null)}  />
        <Wrapper regularPadding>
          <Paragraph>Pillar is a next-generation digital wallet
            and application for personal data management.
          </Paragraph>
          <Paragraph light>Pillar does not store your personal data or know what you’re doing.
          You’ll learn more about our privacy and safety policies as you go.
          </Paragraph>
        </Wrapper>
        <Footer>
          <Button block marginBottom="20px" marginTop="20px" onPress={this.createNewWallet} title="Setup new wallet" />
          <Button onPress={this.importOldWallet} secondary title="Import existing wallet" />
        </Footer>
      </Container>
    );
  }
}
export default Onboarding;
