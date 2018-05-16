// @flow
import * as React from 'react';
import { Text, Keyboard } from 'react-native';
import { connect } from 'react-redux';
import t from 'tcomb-form-native';
import styled from 'styled-components/native';
import { Container, Wrapper } from 'components/Layout';
import Title from 'components/Title';
import TextInput from 'components/TextInput';
import QRCodeScanner from 'components/QRCodeScanner';
import { isValidETHAddress, hasAllValues } from 'utils/validators';
import type { TransactionPayload } from 'models/Transaction';
import { sendAssetAction } from 'actions/assetsActions';
import { pipe, decodeETHAddress } from 'utils/common';


// make Dynamic once more tokens supported
const ETHValidator = (address: string): Function => pipe(decodeETHAddress, isValidETHAddress)(address);
const { Form } = t.form;

type Props = {
  token: string,
  address: string,
  totalBalance: number,
  contractAddress: string,
  isVisible: boolean,
  onModalHide: Function,
  sendAsset: Function,
  formValues?: Object,
}

type State = {
  isScanning: boolean,
  value: ?{
    address: ?string,
    amount: ?number
  },
  formStructure: t.struct,
}


const getFormStructure = (options = {}) => {
  const Amount = t.refinement(t.Number, (amount): boolean => {
    return amount > 0 && amount <= options.totalBalance;
  });

  Amount.getValidationErrorMessage = (amount): string => {
    if (amount > options.totalBalance) {
      return 'Amount should not exceed the total balance.';
    }
    return 'Amount should be specified.';
  };

  return t.struct({
    amount: Amount,
  });
};

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
  },
  order: ['amount', 'address'],
});


const ActionsWrapper = styled.View`
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 15px;
  padding: 5px;
`;

const SendButton = styled.Text`
  font-size: 18;
  font-weight: bold;
  color: ${props => props.disabled ? 'gray' : 'rgb(32, 119, 253)'};
`;

class SendToken extends React.Component<Props, State> {
  _form: t.form;

  constructor(props) {
    super(props);
    this.state = {
      isScanning: false,
      value: null,
      formStructure: getFormStructure(props),
    };
  }

  static getDerivedStateFromProps(nextProps) {
    if (nextProps.totalBalance) {
      return {
        formStructure: getFormStructure(nextProps),
      };
    }
    return null;
  }

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  handleFormSubmit = () => {
    const value = this._form.getValue();
    const {
      sendAsset,
      onModalHide,
      token,
      contractAddress,
    } = this.props;

    if (!value) return;

    const transactionPayload: TransactionPayload = {
      to: value.address,
      amount: value.amount,
      gasLimit: 1500000,
      gasPrice: 20000000000,
      symbol: token,
      contractAddress,
    };

    sendAsset(transactionPayload);
    onModalHide();
    this.setState({
      value: null,
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
    const { token } = this.props;
    const {
      value, isScanning, formStructure,
    } = this.state;
    const formOptions = generateFormOptions({ onIconPress: this.handleToggleQRScanningState, currency: token });
    const isFilled = hasAllValues(value);
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
      <Container>
        <Wrapper padding>
          <Title title="send" />
          <Form
            ref={node => { this._form = node; }}
            type={formStructure}
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
        </Wrapper>
      </Container>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  sendAsset: (transaction: TransactionPayload) => dispatch(sendAssetAction(transaction)),
});

export default connect(null, mapDispatchToProps)(SendToken);
