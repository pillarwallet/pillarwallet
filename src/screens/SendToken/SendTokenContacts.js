// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Keyboard, KeyboardAvoidingView as RNKeyboardAvoidingView } from 'react-native';
import { connect } from 'react-redux';
import { SEND_TOKEN_CONFIRM } from 'constants/navigationConstants';
import t from 'tcomb-form-native';
import { fontSizes } from 'utils/variables';
import { Container, Wrapper } from 'components/Layout';
import { SubtTitle } from 'components/Typography';
import { ButtonMini } from 'components/Button';
import SingleInput from 'components/TextInput/SingleInput';
import type { NavigationScreenProp } from 'react-navigation';
import QRCodeScanner from 'components/QRCodeScanner';
import { isValidETHAddress } from 'utils/validators';
import type { TransactionPayload } from 'models/Transaction';
import { sendAssetAction } from 'actions/assetsActions';
import { pipe, decodeETHAddress } from 'utils/common';
import SendTokenHeader from './SendTokenHeader';

type Props = {
  navigation: NavigationScreenProp<*>,
  sendAsset: Function,
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
      outterImageText="Send"
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
  position: absolute;
  bottom: 80;
  left: 0;
  width: 100%;
`;

const FooterWrapper = styled.View`
  flexDirection: row;
  justify-content: flex-end;
  align-items: center;
  padding: 0 20px;
  width: 100%;
`;

class SendTokenContacts extends React.Component<Props, State> {
  _form: t.form;

  constructor(props) {
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
      transactionPayload,
    });
  };

  handleToggleQRScanningState = () => {
    this.setState({
      isScanning: !this.state.isScanning,
    }, () => {
      if (this.state.isScanning) {
        Keyboard.dismiss();
      }
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
      { onIconPress: this.handleToggleQRScanningState, currency: assetData.token },
    );

    const qrScannerComponent = (
      <QRCodeScanner
        validator={ETHValidator}
        dataFormatter={decodeETHAddress}
        isActive={isScanning}
        onDismiss={this.handleToggleQRScanningState}
        onRead={this.handleQRRead}
      />
    );
    return (
      <React.Fragment>
        <SendTokenHeader
          onBack={this.props.navigation.goBack}
          dismiss={this.props.navigation.dismiss}
          rightLabelText="STEP 2 OF 3"
        />
        <Container>
          <Wrapper regularPadding>
            <SubtTitle style={{ width: '60%' }}>To whom you would like to send?</SubtTitle>
            <Form
              ref={node => { this._form = node; }}
              type={formStructure}
              options={formOptions}
              onChange={this.handleChange}
              onBlur={this.handleChange}
              value={value}
            />
          </Wrapper>
        </Container>
        {qrScannerComponent}
        <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={20}>
          <FooterWrapper>
            <ButtonMini title="Next" onPress={this.handleFormSubmit} />
          </FooterWrapper>
        </KeyboardAvoidingView>
      </React.Fragment>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  sendAsset: (transaction: TransactionPayload) => dispatch(sendAssetAction(transaction)),
});

export default connect(null, mapDispatchToProps)(SendTokenContacts);
