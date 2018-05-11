// @flow
import * as React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { Paragraph, Label } from 'components/Typography';
import { Center, Container, Wrapper } from 'components/Layout';
import Title from 'components/Title';
import Button from 'components/Button';
import { Picker } from 'native-base';
import countries from 'utils/countries.json';
import { confirmOTPAction } from 'actions/signupActions';
import SMSConfirmationInput from './SMSConfirmationInput';

type Props = {
  confirmOTP: Function,
}

const SMSConfirmationLabel = styled(Label)`
  text-align: center;
  max-width: 200px;
`;

class OTP extends React.Component<Props> {
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

  handleOTPConfirmation = (code: string) => {
    const { confirmOTP } = this.props;
    confirmOTP(code);
  };

  handleOTPResend = () => {
  };

  render() {
    return (
      <Container>
        <Wrapper padding>
          <Title title="confirm" />
          <Paragraph>We sent your code to</Paragraph>
          <Paragraph>+441234 567 890</Paragraph>
          <Center>
            <SMSConfirmationInput onCodeFilled={this.handleOTPConfirmation} />
            <SMSConfirmationLabel>Please allow up to 10 minutes for your code to arrive.</SMSConfirmationLabel>
            <Button secondary onPress={this.handleOTPResend} title="Re-send Code" />
          </Center>
        </Wrapper>
      </Container>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  confirmOTP: (code: string) => dispatch(confirmOTPAction(code)),
});

export default connect(null, mapDispatchToProps)(OTP);
