// @flow
import * as React from 'react';
import styled from 'styled-components';
import { Title, Body, Label } from 'components/Typography';
import { Center } from 'components/Layout';
import Container from 'components/Container';
import Wrapper from 'components/Wrapper';
import Footer from 'components/Footer';
import Button from 'components/Button';
import { Picker } from 'native-base';
import countries from 'utils/countries.json';
import SMSConfirmationInput from './SMSConfirmationInput';


type State = {
}


const SMSConfirmationLabel = styled(Label)`
  text-align: center;
  max-width: 200px;
`;

class LoginConfirm extends React.Component<{}, State> {
  generateCountryListPickerItems() {
    return Object.keys(countries)
      .map((key) => countries[key])
      .map((country) => (
        <Picker.Item
          label={country.name.common}
          flag={country.flag}
          value={country.cca2}
          key={country.cca2}
        />
      ));
  }

  goToNextPage = () => {
    // TODO: Link to next page
  }

  goToReSendCodePage = () => {
    // TODO: Link to re-send code page
  }

  render() {
    return (
      <Container>
        <Wrapper padding>
          <Title>confirm</Title>
          <Body>We sent your code to</Body>
          <Body>+441234 567 890</Body>
          <Center>
            <SMSConfirmationInput />
            <SMSConfirmationLabel>Please allow up to 10 minutes for your code to arrive.</SMSConfirmationLabel>
            <Button secondary onPress={this.goToReSendCodePage} title="Re-send Code" />
          </Center>
        </Wrapper>
        <Footer>
          <Button onPress={this.goToNextPage} title="Continue" marginBottom />
        </Footer>
      </Container>
    );
  }
}

export default LoginConfirm;
