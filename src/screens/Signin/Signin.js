// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { OTP } from 'constants/navigationConstants';
import styled from 'styled-components/native';
import { Container } from 'components/Layout';
import Wrapper from 'components/Wrapper';
import Footer from 'components/Footer';
import Button from 'components/Button';
import HyperLink from 'components/HyperLink';
import { Title, Body, Label } from 'components/Typography';
import { Form, Picker, Icon, Input } from 'native-base';
import countries from 'utils/countries.json';

type Props = {
  navigation: NavigationScreenProp<*>,
}

type State = {
  selectedCountry: string,
  selectedCountryFlag: string,
  selectedCountryCallingCode: string,
}

const LoginForm = styled(Form)`
  margin: 20px 0 40px;
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

const FooterText = styled(Label)`
  text-align: center;
  max-width: 300px;
`;

class Signin extends React.Component<Props, State> {
  state = {
    selectedCountry: 'GB',
    selectedCountryFlag: '🇬🇧',
    selectedCountryCallingCode: '44',
  };

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

  handleValueChange(value: string) {
    const country = countries.find(({ cca2 }) => cca2 === value);
    this.setState({
      selectedCountry: value,
      selectedCountryFlag: country.flag || '🌍',
      selectedCountryCallingCode: country.callingCode || '00',
    });
  }

  loginAction = () => {
    this.props.navigation.navigate(OTP);
  };

  render() {
    return (
      <Container>
        <Wrapper padding>
          <Title>login</Title>
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
                handleValueChange={this.handleValueChange}
              >
                {this.generateCountryListPickerItems()}
              </CountryPicker>
            </CountryPickerWrapper>
            <Label>Phone</Label>
            <PhoneInput
              defaultValue={`+${this.state.selectedCountryCallingCode}`}
              keyboardType="phone-pad"
            />
          </LoginForm>
        </Wrapper>
        <Footer>
          <Button onPress={this.loginAction} title="Next" marginBottom />
          <FooterText>
            By signing into Pillar Wallet you are agreeing to our <HyperLink url="http://pillarproject.io/">Terms</HyperLink> and <HyperLink url="http://pillarproject.io/">Privacy policy</HyperLink>
          </FooterText>
        </Footer>
      </Container>
    );
  }
}

export default Signin;
