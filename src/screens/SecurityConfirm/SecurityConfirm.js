// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { BACKUP_PHRASE } from 'constants/navigationConstants';
import { Container, Wrapper, Footer } from 'components/Layout';
import Title from 'components/Title';
import { Paragraph } from 'components/Typography';
import Button from 'components/Button';
import Divider from 'components/Divider';
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
        <Wrapper regularPadding>
          <Title title="security" />
          <Paragraph>
            Keep your backup phrase safe! It will allow you to recover your funds if your device is ever lost or stolen.
          </Paragraph>
          <Paragraph light>
            It is important to store your backup phrase securely where only you have access to it.
             We suggest you write down your passphrase on paper and store it
            in a safe location and/or save it to an encrypted USB drive.
            Multiple redundant backup options are always recommended.
          </Paragraph>
        </Wrapper>
        <Footer>
          <CheckboxItem
            marginBottom
          >
            <Checkbox toggleCheckbox={this.toggleCheckBox} tag="checkbox" checked={!confirmButtonDisabled} />
            <CheckboxText>
              I have read, understand, and agree to the Terms of Use.
            </CheckboxText>
          </CheckboxItem>
          <Divider />
          <Button
            block
            title="Confirm and Finish"
            onPress={this.handleConfirm}
            disabled={confirmButtonDisabled}
            marginBottom="20px"
          />
        </Footer>
      </Container>
    );
  }
}
