// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, Wrapper, Footer } from 'components/Layout';
import { LEGAL_TERMS } from 'constants/navigationConstants';
import Button from 'components/Button';
import { Paragraph, Label } from 'components/Typography';
import Title from 'components/Title';
import { LoginForm, InputField } from 'components/Form';

type Props = {
  navigation: NavigationScreenProp<*>,
}

class NewProfile extends React.Component<Props> {
  handleContinue = () => {
    this.props.navigation.navigate(LEGAL_TERMS);
  };

  render() {
    return (
      <Container>
        <Wrapper padding>
          <Title title="create profile" />
          <Paragraph>Fill our your profile.</Paragraph>
          <LoginForm>
            <Label>Username</Label>
            <InputField
              isFocused
              placeholder="@"
            />
            <Label>Full Name</Label>
            <InputField />
          </LoginForm>
        </Wrapper>
        <Footer>
          <Button block onPress={this.handleContinue} title="Continue" marginBottom="10px" />
        </Footer>
      </Container>
    );
  }
}

export default NewProfile;
