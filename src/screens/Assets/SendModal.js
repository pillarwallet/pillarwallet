// @flow
import * as React from 'react';
import { Text } from 'react-native';
import t from 'tcomb-form-native';
import styled from 'styled-components/native';
import { Label } from 'components/Typography';
import SlideModal from 'components/Modals/SlideModal';
import TextInput from 'components/TextInput';
import QRCodeScanner from 'components/QRCodeScanner';

import { isValidETHAddress } from 'utils/validators';

const { Form } = t.form;

type Props = {
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
  };
  return (
    <TextInput
      errorMessage={errorMessage}
      id="address"
      label={locals.label}
      icon="barcode"
      onIconPress={onIconPress}
      inputProps={inputProps}
    />
  );
}

function AmountInputTemplate(locals) {
  const errorMessage = locals.error;
  const inputProps = {
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    placeholder: 'Specify the amount',
    value: locals.value,
    keyboardType: locals.keyboardType,
    textAlign: 'right',
    style: { paddingRight: 15 },
  };
  return (
    <TextInput
      errorMessage={errorMessage}
      id="amount"
      label={locals.label}
      inputProps={inputProps}
    />
  );
}

const generateFormOptions = (config: Object): Object => ({
  fields: {
    amount: { template: AmountInputTemplate },
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


export default class SendModal extends React.Component<Props, State> {
  _form: t.form

  state = {
    isScanning: false,
    value: {
      address: '',
      amount: 0,
    },
  }

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
    const { isVisible, onDismiss } = this.props;
    const { value, isScanning } = this.state;
    const formOptions = generateFormOptions({ onIconPress: this.handleToggleQRScanningState });
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
            <Text
              onPress={this.handleFormSubmit}
              style={{ color: '#2077FD', fontSize: 16, fontWeight: 'bold' }}
            >
              Send
            </Text>
          </ActionsWrapper>
        </Container>
      </SlideModal>
    );
  }
}
