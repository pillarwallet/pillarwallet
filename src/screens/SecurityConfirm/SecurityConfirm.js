// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { BACKUP_PHRASE } from 'constants/navigationConstants';
import { Container, Wrapper, Footer } from 'components/Layout';
import Header from 'components/Header';
import { Paragraph } from 'components/Typography';
import Button from 'components/Button';
import Checkbox from 'components/Checkbox';
import CheckboxItem from 'components/CheckboxItem';
import CheckboxText from 'components/CheckboxText';


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
            Write down your backup phrase and  store it in several places only you know.
            Be very careful when putting it into a digital file or USB stick -
            always encrypt any digital version of these 12 words.

          </Paragraph>
        </Wrapper>
        <Footer>
          <CheckboxItem
            marginBottom
          >
            <Checkbox toggleCheckbox={this.toggleCheckBox} tag="checkbox" checked={!confirmButtonDisabled} />
            <CheckboxText>
              I understand that if I lose my backup phrase, I risk losing everything stored on my wallet.
            </CheckboxText>
          </CheckboxItem>
          <Button
            block
            title="Continue"
            onPress={this.handleConfirm}
            disabled={confirmButtonDisabled}
            marginBottom="20px"
          />
        </Footer>
      </Container>
    );
  }
}
