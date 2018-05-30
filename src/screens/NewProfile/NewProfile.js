// @flow
import * as React from 'react';
import { KeyboardAvoidingView } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, ScrollWrapper } from 'components/Layout';
import { LEGAL_TERMS } from 'constants/navigationConstants';
import HeaderLink from 'components/HeaderLink';
import { Paragraph, Label } from 'components/Typography';
import Title from 'components/Title';
import { LoginForm, InputField } from 'components/Form';

type Props = {
  navigation: NavigationScreenProp<*>,
}

class NewProfile extends React.Component<Props> {
  static navigationOptions = ({ navigation }: { navigation: NavigationScreenProp<*> }) => ({
    headerRight: (
      <HeaderLink
        onPress={() => navigation.navigate(LEGAL_TERMS)}
      >
      Next
      </HeaderLink>
    ),
  });

  render() {
    return (
      <KeyboardAvoidingView
        behavior="position"
        keyboardVerticalOffset={-100}
        enabled
      >
        <Container>
          <ScrollWrapper padding>
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
          </ScrollWrapper>
        </Container>
      </KeyboardAvoidingView>
    );
  }
}

export default NewProfile;
