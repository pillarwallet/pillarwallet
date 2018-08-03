// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { BACKUP_PHRASE } from 'constants/navigationConstants';
import { Container, Wrapper, Footer } from 'components/Layout';
import Header from 'components/Header';
import { Paragraph } from 'components/Typography';
import Button from 'components/Button';
import Checkbox from 'components/Checkbox';

type Props = {
  navigation: NavigationScreenProp<*>,
};

type State = {
  confirmButtonDisabled: boolean,
};

export default class SecurityConfirm extends React.Component<Props, State> {
  state = {
    confirmButtonDisabled: true,
  };

  toggleCheckBox = () => {
    this.setState({
      confirmButtonDisabled: !this.state.confirmButtonDisabled,
    });
  };

  handleConfirm = () => {
    this.props.navigation.navigate(BACKUP_PHRASE);
  };

  render() {
    const {
      confirmButtonDisabled,
    } = this.state;

    return (
      <Container>
        <Header title="security" onBack={() => this.props.navigation.goBack(null)} />
        <Wrapper regularPadding>
          <Paragraph>
            Keep your backup phrase safe! We don’t have it.
            You’ll need these words if you lose your device or delete your app.
          </Paragraph>
          <Paragraph light>
            Write down your backup phrase and store it in several places only you know.
            Be very careful when putting it into a digital file or USB stick -
            always encrypt any digital version of these 12 words.

          </Paragraph>
        </Wrapper>
        <Footer>
          <Checkbox
            text="I understand that my backup phrase is the only way I can restore my wallet if I lose access."
            onPress={() => this.setState({ confirmButtonDisabled: !confirmButtonDisabled })}
          />
          <Button
            block
            title="Continue"
            onPress={this.handleConfirm}
            disabled={confirmButtonDisabled}
          />
        </Footer>
      </Container>
    );
  }
}
