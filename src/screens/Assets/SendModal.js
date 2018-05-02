// @flow
import * as React from 'react';
import { Text } from 'react-native';
import t from 'tcomb-form-native';
import styled from 'styled-components/native';
import SlideModal from 'components/Modals/SlideModal';
import TextInput from 'components/TextInput';
import QRCodeScanner from 'components/QRCodeScanner';

import { isValidETHAddress } from 'utils/validators';

const { Form } = t.form;

type Props = {
  token: string,
  address: string,
  isVisible: boolean,
  onDismiss: Function,
  formValues?: Object
}

type State = {
  isScanning: boolean,
  value: {
    address: ?string,
    amount: ?number
  }
}

const Amount = t.refinement(t.Number, (amount): boolean => {
  return amount > 0;
});

Amount.getValidationErrorMessage = (): string => {
  return 'Amount should be specified.';
};

const Address = t.refinement(t.String, (address): boolean => {
  return address.length && isValidETHAddress(address);
});

Address.getValidationErrorMessage = (address): string => {
  if (!isValidETHAddress(address)) {
    return 'Invalid Ethereum Address.';
  }
  return 'Address must be provided.';
};

const TRANSACTION_TYPE = t.struct({
  address: Address,
  amount: Amount,
});


// EXTRACT TO FACTORY
function AddressInputTemplate(locals) {
  const { config: { onIconPress } } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    placeholder: 'Ethereum Address',
    value: locals.value,
    keyboardType: locals.keyboardType,
    textAlign: 'right',
    maxLength: 42,
    style: {
      paddingRight: 40,
      fontSize: 12,
    },
  };
  return (
    <TextInput
      errorMessage={errorMessage}
      id="address"
      label={locals.label}
      icon="ios-qr-scanner"
      onIconPress={onIconPress}
      inputProps={inputProps}
    />
  );
}

function AmountInputTemplate(locals) {
  const { config: { currency } } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    autoFocus: true,
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    placeholder: '0.00',
    value: locals.value,
    ellipsizeMode: 'middle',
    keyboardType: locals.keyboardType,
    textAlign: 'right',
    style: {
      paddingRight: 40,
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 0,
    },
  };

  return (
    <TextInput
      postfix={currency}
      errorMessage={errorMessage}
      id="amount"
      label={locals.label}
      inputProps={inputProps}
    />
  );
}

const generateFormOptions = (config: Object): Object => ({
  fields: {
    amount: { template: AmountInputTemplate, config },
    address: { template: AddressInputTemplate, config, label: 'To' },
  },
  order: ['amount', 'address'],
});

const Container = styled.View`
  justifyContent: flex-start;
  paddingTop: 20px;
  flex: 1;
  alignSelf: stretch;
`;

const ActionsWrapper = styled.View`
  flex: 1;
  flexDirection: row;
  justifyContent: space-between;
  alignItems: flex-start;
  marginTop: 15px;
  padding: 5px;
`;

const SendButton = styled.Text`
  fontSize: 18;
  fontWeight: bold;
  color: ${props => props.disabled ? 'gray' : 'rgb(32, 119, 253)'};
`;

export default class SendModal extends React.Component<Props, State> {
  _form: t.form;

  state = {
    isScanning: false,
    value: {
      address: '',
      amount: undefined,
    },
  };

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  handleFormSubmit = () => {
    // const value = this._form.getValue();
    // if (!value) return;
    // HANDLE FORM SUBMISSION
  };

  handleToggleQRScanningState = () => {
    this.setState({
      isScanning: !this.state.isScanning,
    });
  };

  handleQRRead = (address: string) => {
    this.setState({ value: { ...this.state.value, address }, isScanning: false });
  };


  render() {
    const { isVisible, onDismiss, token } = this.props;
    const { value, isScanning } = this.state;
    const formOptions = generateFormOptions({ onIconPress: this.handleToggleQRScanningState, currency: token });
    const isFilled = Object.keys(value).length === Object.values(value).filter(Boolean).length;
    const qrScannnerComponent = (
      <QRCodeScanner
        validator={isValidETHAddress}
        isActive={isScanning}
        onDismiss={this.handleToggleQRScanningState}
        onRead={this.handleQRRead}
      />
    );
    return (
      <SlideModal title="send." isVisible={isVisible} onDismiss={onDismiss} fullScreenComponent={qrScannnerComponent}>
        <Container>
          <Form
            ref={node => { this._form = node; }}
            type={TRANSACTION_TYPE}
            options={formOptions}
            value={value}
            onChange={this.handleChange}
          />
          <ActionsWrapper>
            <Text>Fee: <Text style={{ fontWeight: 'bold', color: '#000' }}>0.0004ETH</Text></Text>
            <SendButton
              onPress={this.handleFormSubmit}
              disabled={!isFilled}
            >
              Send
            </SendButton>
          </ActionsWrapper>
        </Container>
      </SlideModal>
    );
  }
}
