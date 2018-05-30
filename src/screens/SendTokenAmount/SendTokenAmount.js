// @flow
import * as React from 'react';
import { Text, Keyboard, TouchableOpacity } from 'react-native';
import t from 'tcomb-form-native';
import styled from 'styled-components/native';
import { Container, Wrapper } from 'components/Layout';
import Title from 'components/Title';
import ButtonIcon from 'components/ButtonIcon';
import TextInput from 'components/TextInput';
import type { NavigationScreenProp } from 'react-navigation';
import { SEND_TOKEN_CONTACTS } from 'constants/navigationConstants';
import QRCodeScanner from 'components/QRCodeScanner';
import { isValidETHAddress } from 'utils/validators';
import type { TransactionPayload } from 'models/Transaction';
import { pipe, decodeETHAddress } from 'utils/common';
import { baseColors, fontSizes } from 'utils/variables';
import SendTokenAmountHeader from './SendTokenAmountHeader';


// make Dynamic once more tokens supported
const ETHValidator = (address: string): Function => pipe(decodeETHAddress, isValidETHAddress)(address);
const { Form } = t.form;

type Props = {
  token: string,
  address: string,
  totalBalance: number,
  contractAddress: string,
  navigation: NavigationScreenProp<*>,
  isVisible: boolean,
  sendAsset: Function,
  formValues?: Object,
}

type State = {
  isScanning: boolean,
  asset: Object,
  value: ?{
    amount: ?number
  },
  formStructure: t.struct,
}


const getFormStructure = (totalBalance) => {
  const Amount = t.refinement(t.Number, (amount): boolean => {
    return amount > 0 && amount <= totalBalance;
  });

  Amount.getValidationErrorMessage = (amount): string => {
    if (amount > totalBalance) {
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
      inputType="amount"
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
});

const ActionsWrapper = styled.View`
  margin-top: 10px;
  margin-bottom: 20px;
`;

const UseMaxValueButton = styled.Text`
  color: ${baseColors.clearBlue};
  width: 100%;
  text-align: right;
`;

export default class SendTokenAmount extends React.Component<Props, State> {
  _form: t.form;

  constructor(props: Props) {
    super(props);
    const asset = this.props.navigation.getParam('asset', {});
    this.state = {
      isScanning: false,
      value: null,
      formStructure: getFormStructure(asset.balance),
      asset,
    };
  }


  handleChange = (value: Object) => {
    this.setState({ value });
  };

  handleFormSubmit = () => {
    const value = this._form.getValue();
    const {
      sendAsset,
      token,
      contractAddress,
      navigation,
    } = this.props;
    const { asset } = this.state;

    if (!value) return;

    const transactionPayload: TransactionPayload = {
      to: '',
      amount: value.amount,
      gasLimit: 1500000,
      gasPrice: 20000000000,
      symbol: token,
      contractAddress,
    };
    navigation.push(SEND_TOKEN_CONTACTS, {
      asset,
      transactionPayload,
      sendAsset,
    });
  };

  useMaxValue = () => {
    const maxValue = this.state.asset.balance - 0.0004;
    this.setState({
      value: {
        amount: maxValue,
      },
    });
  };

  openFeeInfoModal = () => {
    // Add fee modal logic in here
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
      value,
      isScanning,
      formStructure,
      asset,
    } = this.state;
    const formOptions = generateFormOptions({ currency: asset.symbol });

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
        <SendTokenAmountHeader
          onBack={this.props.navigation.goBack}
          nextOnPress={this.handleFormSubmit}
          balanceAmount={asset.balance.toString()}
          symbol={asset.symbol}
        />
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
            <TouchableOpacity onPress={this.useMaxValue}>
              <UseMaxValueButton>Use Max</UseMaxValueButton>
            </TouchableOpacity>
            <ActionsWrapper>
              <Text>
                Fee:
                <Text style={{ fontWeight: 'bold', color: '#000' }}>
                  0.0004 ETH
                  <ButtonIcon
                    icon="alert"
                    color={baseColors.clearBlue}
                    fontSize={fontSizes.large}
                    onPress={this.openFeeInfoModal}

                  />
                </Text>
              </Text>
            </ActionsWrapper>
          </Wrapper>
        </Container>
        {qrScannerComponent}
      </React.Fragment>
    );
  }
}
