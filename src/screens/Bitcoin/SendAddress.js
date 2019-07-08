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
import styled from 'styled-components/native';
import { Keyboard } from 'react-native';
import { SEND_BITCOIN_AMOUNT } from 'constants/navigationConstants';
import t from 'tcomb-form-native';
import { baseColors, fontSizes, spacing, UIColors } from 'utils/variables';
import { Container, Footer } from 'components/Layout';
import Button from 'components/Button';
import SingleInput from 'components/TextInput/SingleInput';
import type { NavigationScreenProp } from 'react-navigation';
import QRCodeScanner from 'components/QRCodeScanner';
import Header from 'components/Header';
import { isValidBTCAddress } from 'utils/validators';
import { pipe, decodeBTCAddress } from 'utils/common';

type Props = {
  navigation: NavigationScreenProp<*>,
};

type State = {
  isScanning: boolean,
  value: {
    address: string,
  },
  formStructure: t.struct,
};

const qrCode = require('assets/images/qr.png');

const FormWrapper = styled.View`
  padding: 0 ${spacing.rhythm}px;
  margin-bottom: ${spacing.medium}px;
  margin-top: -20px;
`;

const HeaderWrapper = styled.View`
  background-color: ${baseColors.white};
  border-bottom-color: ${baseColors.mediumLightGray};
  border-bottom-width: 1px;
`;

const BTCValidator = (address: string): Function => pipe(decodeBTCAddress, isValidBTCAddress)(address);
const { Form } = t.form;

function AddressInputTemplate(locals) {
  const { config: { onIconPress } } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    placeholder: 'Username or wallet address',
    value: locals.value,
    keyboardType: locals.keyboardType,
    textAlign: 'left',
    maxLength: 42,
    letterSpacing: 0.1,
    fontSize: fontSizes.small,
    fontWeight: 300,
  };
  return (
    <SingleInput
      errorMessage={errorMessage}
      outterIconText="SCAN"
      outterIcon={qrCode}
      id="address"
      onPress={onIconPress}
      inputProps={inputProps}
      fontSize={fontSizes.small}
      marginTop={30}
    />
  );
}

const getFormStructure = () => {
  const Address = t.refinement(t.String, (address): boolean => {
    return address.length && isValidBTCAddress(address);
  });

  Address.getValidationErrorMessage = (address): string => {
    if (!isValidBTCAddress(address)) {
      return 'Invalid Bitcoin Address.';
    }
    return 'Address must be provided.';
  };

  return t.struct({
    address: Address,
  });
};

const generateFormOptions = (config: Object): Object => ({
  fields: {
    address: { template: AddressInputTemplate, config, label: 'To' },
  },
});

class SendAddress extends React.Component<Props, State> {
  _form: t.form;
  fromAddress: string

  constructor(props: Props) {
    const { navigation } = props;

    super(props);

    this.fromAddress = navigation.getParam('fromAddress', '');

    this.state = {
      isScanning: false,
      value: { address: '' },
      formStructure: getFormStructure(),
    };
  }

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  handleFormSubmit = () => {
    const value = this._form.getValue();
    if (!value) return;

    this.navigateToNextScreen(value.address);
  };

  handleQRScannerOpen = async () => {
    this.setState(prevState => {
      return { isScanning: !prevState.isScanning };
    }, () => {
      if (this.state.isScanning) {
        Keyboard.dismiss();
      }
    });
  };

  handleQRScannerClose = () => {
    this.setState({ isScanning: false });
  };

  handleQRRead = (address: string) => {
    this.setState({ value: { ...this.state.value, address }, isScanning: false }, () => {
      this.navigateToNextScreen(address);
    });
  };

  navigateToNextScreen(address: string): void {
    const { navigation } = this.props;

    navigation.navigate(SEND_BITCOIN_AMOUNT, {
      fromAddress: this.fromAddress,
      toAddress: address,
    });
  }

  render() {
    const {
      navigation,
    } = this.props;
    const { isScanning, formStructure, value } = this.state;

    const formOptions = generateFormOptions({ onIconPress: this.handleQRScannerOpen });

    return (
      <Container inset={{ bottom: 0 }} color={baseColors.white}>
        <HeaderWrapper>
          <Header
            onBack={() => navigation.goBack(null)}
            title="send Bitcoin"
            centerTitle
          />
          <FormWrapper>
            <Form
              ref={node => {
                this._form = node;
              }}
              type={formStructure}
              options={formOptions}
              onChange={this.handleChange}
              onBlur={this.handleChange}
              value={value}
            />
          </FormWrapper>
        </HeaderWrapper>
        <QRCodeScanner
          validator={BTCValidator}
          dataFormatter={decodeBTCAddress}
          isActive={isScanning}
          onDismiss={this.handleQRScannerClose}
          onRead={this.handleQRRead}
        />
        {!!value && !!value.address.length &&
          <Footer keyboardVerticalOffset={35} backgroundColor={UIColors.defaultBackgroundColor}>
            <Button flexRight small disabled={!value.address.length} title="Next" onPress={this.handleFormSubmit} />
          </Footer>
        }
      </Container>
    );
  }
}

export default SendAddress;
