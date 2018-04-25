// @flow
import * as React from 'react';
import styled from 'styled-components';
import Container from 'components/Container';
import Wrapper from 'components/Wrapper';
import Footer from 'components/Footer';
import Button from 'components/Button';
import { Title, Body, Label } from 'components/Typography';
import { Form, Picker, Icon, Input } from 'native-base';
import countries from 'utils/countries.json';


type State = {
  selectedCountry: string,
  selectedCountryFlag: string,
  selectedCountryCallingCode: string
}

const LoginForm = styled(Form)`
  margin: 20px 0 80px;
`;

const PhoneInput = styled(Input)`
  border-bottom-width: 1px;
  border-color: rgb(151,151,151);
  font-size: 24px;
`;

const Emoji = styled.Text`
  flex: 0 0 40px;
  font-size: 36px;
  line-height: 50px;
`;

const CountryPicker = styled(Picker)`
  flex: 1;
  align-self: flex-end;
`;

const CountryPickerWrapper = styled.View`
  width: 100%;
  margin-bottom: 20px;
  flex-direction: row;
  justify-content: space-between;
  border-bottom-width: 1px;
  border-color: rgb(151,151,151);
`;

class Login extends React.Component<{}, State> {
  state = {
    selectedCountry: 'GB',
    selectedCountryFlag: '🇬🇧',
    selectedCountryCallingCode: '44',
  }

  generateCountryListPickerItems() {
    const countryListPickerItems = [];
    Object.keys(countries).map((key, index) => {
      countryListPickerItems.push(
        <Picker.Item
          label={countries[key].name.common}
          flag={countries[key].flag}
          value={countries[key].cca2}
          key={index}
        />,
      );
    });
    return countryListPickerItems;
  }

  onValueChange(value: string) {
    console.log(value);
    const newSelectedCountry = countries.find((country) => {
      return (country.cca2 === value);
    });

    this.setState({
      selectedCountry: value,
      selectedCountryFlag: newSelectedCountry.flag.length > 1 ? newSelectedCountry.flag : '🌍',
      selectedCountryCallingCode: newSelectedCountry.callingCode > 0 ? newSelectedCountry.callingCode : '00',
    });
  }

  goToNextPage = () => {
    // TODO: Link to next page
    console.log('hello');
    return 'hello';
  }

  render() {
    return (
      <Container>
        <Wrapper padding>
          <Title>Hello</Title>
          <Body>Please enter the mobile number associated with your account.</Body>
          <LoginForm>
            <Label>Country</Label>
            <CountryPickerWrapper>
              <Emoji>{this.state.selectedCountryFlag}</Emoji>
              <CountryPicker
                iosHeader="Select Country"
                iosIcon={<Icon name="ios-arrow-down-outline" />}
                mode="dropdown"
                selectedValue={this.state.selectedCountry}
                onValueChange={(value) => this.onValueChange(value)}
              >
                {this.generateCountryListPickerItems()}
              </CountryPicker>
            </CountryPickerWrapper>
            <Label>Phone</Label>
            <PhoneInput
              defaultValue={`+${this.state.selectedCountryCallingCode}`}
            />
          </LoginForm>
          <Footer>
            <Button onPress={this.goToNextPage} title="Next" />
          </Footer>
        </Wrapper>
      </Container>
    );
  }
}

export default Login;
