// @flow
import * as React from 'react';
import { Text } from 'react-native';
import { connect } from 'react-redux';
import t from 'tcomb-form-native';
import styled from 'styled-components/native';
import SlideModal from 'components/Modals/SlideModal';
import TextInput from 'components/TextInput';
import QRCodeScanner from 'components/QRCodeScanner';
import type { TransactionPayload } from 'models/Transaction';
import { sendAssetAction } from 'actions/assetsActions';
import { isValidETHAddress } from 'utils/validators';
import { pipe, decodeETHAddress } from 'utils/common';


// make Dynamic once more tokens supported
const ETHValidator = (address: string): Function => pipe(decodeETHAddress, isValidETHAddress)(address);

const { Form } = t.form;

type Props = {
  address: string,
  isVisible: boolean,
  onDismiss: Function,
  sendAsset: Function,
  formValues?: Object
}

type State = {
  isScanning: boolean,
  value: ?{
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

const gerenareteFormOptions = (config: Object): Object => ({
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


class SendModal extends React.Component<Props, State> {
  _form: t.form;

  handleDismissal: Function;

  handleDismissal = () => {}

  state = {
    isScanning: false,
    value: null,
  }

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  handleFormSubmit = () => {
    const value = this._form.getValue();
    const { sendAsset } = this.props;
    if (!value) return;
    const transactionPayload: TransactionPayload = {
      address: value.address,
      amount: value.amount,
      gasLimit: 1500000,
      gasPrice: 20000000000,
    };
    sendAsset(transactionPayload);
    this.handleDismissal();
    this.setState({
      value: null,
    });
  };

  handleToggleQRScanningState = () => {
    this.setState({
      isScanning: !this.state.isScanning,
    });
  };

  // HOC DRILL PATTERN
  handleCallbackRegistration = (cb: Function) => {
    this.handleDismissal = cb;
  }

  handleQRRead = (address: string) => {
    this.setState({ value: { ...this.state.value, address }, isScanning: false });
  };

  render() {
    const { isVisible, onDismiss } = this.props;
    const { value, isScanning } = this.state;
    const formOptions = gerenareteFormOptions({ onIconPress: this.handleToggleQRScanningState });
    const qrScannnerComponent = (
      <QRCodeScanner
        validator={ETHValidator}
        dataFormatter={decodeETHAddress}
        isActive={isScanning}
        onDismiss={this.handleToggleQRScanningState}
        onRead={this.handleQRRead}
      />
    );
    return (
      <SlideModal
        modalDismissalCallback={this.handleCallbackRegistration}
        title="send."
        isVisible={isVisible}
        onDismiss={onDismiss}
        fullScreenComponent={qrScannnerComponent}
      >
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

const mapDispatchToProps = (dispatch) => ({
  sendAsset: (transaction: TransactionPayload) => dispatch(sendAssetAction(transaction)),
});

export default connect(null, mapDispatchToProps)(SendModal);
