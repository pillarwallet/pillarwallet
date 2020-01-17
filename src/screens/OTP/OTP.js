// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';

import type { VerificationPhoneAction } from 'actions/userActions';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import { Paragraph, Label } from 'components/Typography';
import { Center, Container, Wrapper } from 'components/Layout';
import Button from 'components/Button';
import { Picker } from 'native-base';
import countries from 'utils/countries.json';
import Header from 'components/Header';
import { createOneTimePasswordAction, verifyPhoneAction } from 'actions/userActions';
import SMSConfirmationInput from './SMSConfirmationInput';

type Props = {
  confirmOTP: Function,
  createOneTimePassword: Function,
  user: Object,
  navigation: NavigationScreenProp<*>,
};

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
    const { confirmOTP, user, navigation } = this.props;
    confirmOTP({ walletId: user.walletId, phone: user.phone, oneTimePassword: code }, () => {
      navigation.goBack();
    });
  };

  handleOTPResend = () => {
    const { createOneTimePassword, user } = this.props;
    createOneTimePassword(user.walletId, { phone: user.phone });
  };

  render() {
    const { navigation } = this.props;
    const phone = navigation.getParam('phone');
    return (
      <Container>
        <Header gray title="confirm" onBack={() => navigation.goBack(null)} />
        <Wrapper regularPadding>
          <Paragraph>We sent your code to</Paragraph>
          <Paragraph>{phone}</Paragraph>
          <Center>
            <SMSConfirmationInput onCodeFilled={this.handleOTPConfirmation} />
            <SMSConfirmationLabel>Please allow up to 10 minutes for your code to arrive.</SMSConfirmationLabel>
            <Button style={{ marginTop: 30 }} secondary onPress={this.handleOTPResend} title="Re-send Code" />
          </Center>
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({ user: { data: user } }: RootReducerState): $Shape<Props> => ({
  user,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  confirmOTP: (props: VerificationPhoneAction, callback: Function) => dispatch(verifyPhoneAction(props, callback)),
  createOneTimePassword: (walletId: string, field: Object, callback: Function) =>
    dispatch(createOneTimePasswordAction(walletId, field, callback)),
});

export default connect(mapStateToProps, mapDispatchToProps)(OTP);
