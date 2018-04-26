// @flow
import * as React from 'react';
import styled from 'styled-components';
import Container from 'components/Container';
import Wrapper from 'components/Wrapper';
import Footer from 'components/Footer';
import Button from 'components/Button';
import { Title, Body, Label } from 'components/Typography';
import { Picker } from 'native-base';
import countries from 'utils/countries.json';


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

  render() {
    return (
      <Container>
        <Wrapper padding>
          <Title>confirm</Title>
          <Body>We sent your code to</Body>
          <Body>+441234 567 890</Body>
          <SMSConfirmationLabel>Please allow up to 10 minutes for your code to arrive.</SMSConfirmationLabel>
        </Wrapper>
        <Footer>
          <Button onPress={this.goToNextPage} title="Next" marginBottom />
        </Footer>
      </Container>
    );
  }
}

export default LoginConfirm;
