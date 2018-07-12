// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Keyboard, KeyboardAvoidingView as RNKeyboardAvoidingView, View } from 'react-native';
import { Permissions } from 'expo';
import { SEND_TOKEN_CONFIRM } from 'constants/navigationConstants';
import t from 'tcomb-form-native';
import { fontSizes } from 'utils/variables';
import { Container } from 'components/Layout';
import { SubTitle } from 'components/Typography';
import { ButtonMini } from 'components/Button';
import SingleInput from 'components/TextInput/SingleInput';
import type { NavigationScreenProp } from 'react-navigation';
import QRCodeScanner from 'components/QRCodeScanner';
import ModalScreenHeader from 'components/ModalScreenHeader';
import { isValidETHAddress } from 'utils/validators';
import { pipe, decodeETHAddress } from 'utils/common';

const PERMISSION_GRANTED = 'GRANTED';

type Props = {
  navigation: NavigationScreenProp<*>,
}

type State = {
  isScanning: boolean,
  transactionPayload: Object,
  assetData: Object,
  value: {
    address: string,
  },
  formStructure: t.struct,
}

const qrCode = require('assets/images/qr.png');

// make Dynamic once more tokens supported
const ETHValidator = (address: string): Function => pipe(decodeETHAddress, isValidETHAddress)(address);
const { Form } = t.form;

function AddressInputTemplate(locals) {
  const { config: { onIconPress } } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    placeholder: 'Ethereum Address',
    value: locals.value,
    keyboardType: locals.keyboardType,
    textAlign: 'left',
    maxLength: 42,
    fontSize: fontSizes.medium,
    fontWeight: 300,
  };
  return (
    <SingleInput
      errorMessage={errorMessage}
      outterImageText="Scan"
      outterImageURI={qrCode}
      id="address"
      onPress={onIconPress}
      inputProps={inputProps}
    />
  );
}

const getFormStructure = () => {
  const Address = t.refinement(t.String, (address): boolean => {
    return address.length && isValidETHAddress(address);
  });

  Address.getValidationErrorMessage = (address): string => {
    if (!isValidETHAddress(address)) {
      return 'Invalid Ethereum Address.';
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

const KeyboardAvoidingView = styled(RNKeyboardAvoidingView)`
  flex: 1;
  width: 100%;
  justify-content: space-between;
  padding-bottom: 30px;
`;

const BodyWrapper = styled.View`
  padding: 0 16px;
`;

const FooterWrapper = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  padding: 0 15px;
  width: 100%;
  margin-bottom: 20px;
  margin-top: 30px;
`;

class SendTokenContacts extends React.Component<Props, State> {
  _form: t.form;

  constructor(props: Props) {
    super(props);
    const transactionPayload = this.props.navigation.getParam('transactionPayload', {});
    const assetData = this.props.navigation.getParam('assetData', {});
    this.state = {
      isScanning: false,
      value: { address: '' },
      formStructure: getFormStructure(),
      transactionPayload,
      assetData,
    };
  }

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  handleFormSubmit = () => {
    const value = this._form.getValue();
    if (!value) return;
    const { assetData, transactionPayload } = this.state;
    this.props.navigation.navigate(SEND_TOKEN_CONFIRM, {
      assetData,
      transactionPayload: { ...transactionPayload, to: value.address },
    });
  };

  handleQRScannerOpen = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
      isScanning: status.toUpperCase() === PERMISSION_GRANTED,
    }, () => {
      if (this.state.isScanning) {
        Keyboard.dismiss();
      }
    });
  };

  handleQRScannerClose = () => {
    this.setState({
      isScanning: false,
    });
  };

  handleQRRead = (address: string) => {
    this.setState({ value: { ...this.state.value, address }, isScanning: false });
  };

  render() {
    const {
      isScanning,
      assetData,
      formStructure,
      value,
    } = this.state;
    const formOptions = generateFormOptions(
      { onIconPress: this.handleQRScannerOpen, currency: assetData.token },
    );

    const qrScannerComponent = (
      <QRCodeScanner
        validator={ETHValidator}
        dataFormatter={decodeETHAddress}
        isActive={isScanning}
        onDismiss={this.handleQRScannerClose}
        onRead={this.handleQRRead}
      />
    );
    return (
      <React.Fragment>
        <Container>
          <KeyboardAvoidingView behavior="padding">
            <View>
              <ModalScreenHeader
                onBack={this.props.navigation.goBack}
                onClose={this.props.navigation.dismiss}
                rightLabelText="step 2 of 3"
                title="send"
              />
              <BodyWrapper>
                <SubTitle>To whom you would like to send?</SubTitle>
                <Form
                  ref={node => { this._form = node; }}
                  type={formStructure}
                  options={formOptions}
                  onChange={this.handleChange}
                  onBlur={this.handleChange}
                  value={value}
                />
                {qrScannerComponent}
              </BodyWrapper>
            </View>
            <FooterWrapper>
              <ButtonMini title="Next" onPress={this.handleFormSubmit} />
            </FooterWrapper>
          </KeyboardAvoidingView>
        </Container>
      </React.Fragment>
    );
  }
}

export default SendTokenContacts;
