// @flow
import * as React from 'react';
import { Text, Keyboard, TouchableOpacity } from 'react-native';
import t from 'tcomb-form-native';
import { utils, providers } from 'ethers';
import { NETWORK_PROVIDER } from 'react-native-dotenv';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import { Container, Wrapper } from 'components/Layout';
import Title from 'components/Title';
import ButtonIcon from 'components/ButtonIcon';
import TextInput from 'components/TextInput';
import type { NavigationScreenProp } from 'react-navigation';
import { SEND_TOKEN_CONTACTS } from 'constants/navigationConstants';
import { ETH } from 'constants/assetsConstants';
import QRCodeScanner from 'components/QRCodeScanner';
import type { TransactionPayload } from 'models/Transaction';
import { isValidETHAddress } from 'utils/validators';
import { pipe, parseNumber, decodeETHAddress, formatMoney, formatAmount } from 'utils/common';
import { baseColors, fontSizes } from 'utils/variables';
import SendTokenAmountHeader from './SendTokenAmountHeader';


// make Dynamic once more tokens supported
const ETHValidator = (address: string): Function => pipe(decodeETHAddress, isValidETHAddress)(address);
const { Form } = t.form;
const gasLimit = 21000;

const getFormStructure = (maxAmount: number) => {
  const Amount = t.refinement(t.Number, (amount): boolean => {
    amount = parseNumber(amount.toString());
    return amount > 0 && amount <= maxAmount;
  });

  Amount.getValidationErrorMessage = (amount): string => {
    if (amount >= maxAmount) {
      return 'Amount should not exceed the total balance.';
    // } else if (amount > totalBalance - transactionFee) {
    //   return 'Not enough funds to process transaction fee';
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
    keyboardType: 'numeric',
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

type Props = {
  token: string,
  address: string,
  totalBalance: number,
  contractAddress: string,
  navigation: NavigationScreenProp<*>,
  isVisible: boolean,
  formValues?: Object,
}

type State = {
  isScanning: boolean,
  value: ?{
    amount: ?number
  },
  formStructure: t.struct,
  txFeeInWei: ?Object, // BigNumber
}

export default class SendTokenAmount extends React.Component<Props, State> {
  _form: t.form;
  assetData: Object;
  gasPrice: Object; // BigNumber
  gasPriceFetched: boolean = false;

  constructor(props: Props) {
    super(props);
    this.assetData = this.props.navigation.getParam('assetData', {});
    this.state = {
      isScanning: false,
      value: null,
      formStructure: getFormStructure(this.assetData.balance),
      txFeeInWei: null,
    };
  }

  componentDidMount() {
    const provider = providers.getDefaultProvider(NETWORK_PROVIDER);
    provider.getGasPrice()
      .then(gasPrice => {
        this.gasPriceFetched = true;
        this.gasPrice = gasPrice;
        const { token, balance } = this.assetData;
        const txFeeInWei = gasPrice.mul(gasLimit);
        const maxAmount = this.calculateMaxAmount(token, balance, txFeeInWei);

        this.setState({
          txFeeInWei,
          formStructure: getFormStructure(maxAmount),
        });
      })
      .catch(() => {});
  }

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  handleFormSubmit = () => {
    const value = this._form.getValue();
    const { navigation } = this.props;

    if (!value || !this.gasPriceFetched) return;

    const transactionPayload: TransactionPayload = {
      to: '',
      amount: parseNumber(value.amount),
      gasLimit,
      gasPrice: this.gasPrice.toNumber(),
      symbol: this.assetData.symbol,
      contractAddress: this.assetData.contractAddress,
    };
    navigation.navigate(SEND_TOKEN_CONTACTS, {
      assetData: this.assetData,
      transactionPayload,
    });
  };

  useMaxValue = () => {
    if (!this.gasPriceFetched) return;
    const { txFeeInWei } = this.state;
    const { token, balance } = this.assetData;
    const maxAmount = this.calculateMaxAmount(token, balance, txFeeInWei);

    this.setState({
      value: {
        amount: formatAmount(maxAmount),
      },
    });
  };

  calculateMaxAmount = (token: string, balance: number, txFeeInWei: ?Object): number => {
    if (token !== ETH) {
      return balance;
    }

    const maxAmount = utils.parseUnits(balance, 'ether').sub(txFeeInWei);
    if (maxAmount.lt(0)) return 0;
    return new BigNumber(utils.formatEther(maxAmount)).toNumber();
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
      txFeeInWei,
    } = this.state;
    const formOptions = generateFormOptions({ currency: this.assetData.token });

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
          balanceAmount={formatMoney(this.assetData.balance, 6)}
          symbol={this.assetData.symbol}
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
                  {txFeeInWei && ` ${utils.formatEther(txFeeInWei.toString())} ETH`}
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
