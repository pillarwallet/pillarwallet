// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { Text, TouchableOpacity, KeyboardAvoidingView as RNKeyboardAvoidingView, View, Platform } from 'react-native';
import t from 'tcomb-form-native';
import { utils, providers } from 'ethers';
import { NETWORK_PROVIDER } from 'react-native-dotenv';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, Wrapper } from 'components/Layout';
import SingleInput from 'components/TextInput/SingleInput';
import { ButtonMini } from 'components/Button';
import { SEND_TOKEN_CONTACTS } from 'constants/navigationConstants';
import { ETH } from 'constants/assetsConstants';
import { SubTitle, TextLink, Paragraph } from 'components/Typography';
import ModalScreenHeader from 'components/ModalScreenHeader';
import type { TransactionPayload } from 'models/Transaction';
import type { Assets } from 'models/Asset';
import { parseNumber, formatAmount, isValidNumber } from 'utils/common';

const provider = providers.getDefaultProvider(NETWORK_PROVIDER);

const { Form } = t.form;
const gasLimit = 21000;

const getFormStructure = (maxAmount: number, enoughForFee: boolean, formSubmitted: boolean) => {
  const Amount = t.refinement(t.String, (amount): boolean => {
    if (amount.toString() === '' && !formSubmitted) return true;
    if (!isValidNumber(amount.toString())) return false;

    amount = parseNumber(amount.toString());
    const isValid = enoughForFee && amount <= maxAmount;

    if (formSubmitted) return isValid && amount > 0;
    return isValid;
  });

  Amount.getValidationErrorMessage = (amount): string => {
    if (!isValidNumber(amount.toString())) {
      return 'Incorrect number entered.';
    }

    amount = parseNumber(amount.toString());
    if (amount >= maxAmount) {
      return 'Amount should not exceed the total balance.';
    } else if (!enoughForFee) {
      return 'Not enough ETH to process the transaction fee';
    }
    return 'Amount should be specified.';
  };

  return t.struct({
    amount: Amount,
  });
};

function AmountInputTemplate(locals) {
  const { config: { icon } } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    autoFocus: true,
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    placeholder: '0',
    value: locals.value,
    ellipsizeMode: 'middle',
    keyboardType: Platform.OS === 'ios' ? 'numeric' : 'default',
    textAlign: 'right',
    autoCapitalize: 'none',
  };

  return (
    <SingleInput
      innerImageURI={icon}
      errorMessage={errorMessage}
      id="amount"
      inputProps={inputProps}
      inlineLabel
    />
  );
}

const generateFormOptions = (config: Object): Object => ({
  fields: {
    amount: {
      template: AmountInputTemplate,
      config,
      transformer: {
        parse: (str = '') => str.toString(),
        format: (value = '') => value.toString(),
      },
    },
  },
});

const KeyboardAvoidingView = Platform.OS === 'ios' ?
  styled(RNKeyboardAvoidingView)`
  flex: 1;
  position: absolute;
  bottom: 40;
  left: 0;
  width: 100%;
` :
  styled(RNKeyboardAvoidingView)`
  flex: 1;
  width: 100%;
  justify-content: space-between;
  padding-bottom: 50px;
`;

const BodyWrapper = styled.View`
  padding: 0 16px;
`;

const ActionsWrapper = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
`;

const FooterWrapper = Platform.OS === 'ios' ?
  styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  width: 100%;
` :
  styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  width: 100%;
  margin-bottom: 20px;
  margin-top: 30px;
`;
type Props = {
  token: string;

  address: string,
  totalBalance: number,
  contractAddress: string,
  navigation: NavigationScreenProp<*>,
  isVisible: boolean,
  formValues?: Object,
  assets: Object,
}

type State = {
  value: ?{
    amount: ?number
  },
  formStructure: t.struct,
  txFeeInWei: ?Object, // BigNumber
}

class SendTokenAmount extends React.Component<Props, State> {
  _form: t.form;
  assetData: Object;
  gasPrice: Object; // BigNumber
  gasPriceFetched: boolean = false;
  maxAmount: number;
  formSubmitted: boolean = false;
  enoughForFee: boolean = false;

  constructor(props: Props) {
    super(props);
    this.assetData = this.props.navigation.getParam('assetData', {});
    this.maxAmount = this.assetData.balance;
    this.state = {
      value: null,
      formStructure: getFormStructure(this.assetData.balance, this.enoughForFee, this.formSubmitted),
      txFeeInWei: null,
    };
  }

  componentDidMount() {
    provider.getGasPrice()
      .then(gasPrice => {
        const increasedGasPrice = gasPrice.mul(2);
        this.gasPrice = increasedGasPrice;
        this.gasPriceFetched = true;
        const { token, balance } = this.assetData;
        const { assets } = this.props;
        const txFeeInWei = this.gasPrice.mul(gasLimit);
        this.maxAmount = this.calculateMaxAmount(token, balance, txFeeInWei);
        this.enoughForFee = this.checkIfEnoughForFee(assets, txFeeInWei);

        this.setState({
          txFeeInWei,
          formStructure: getFormStructure(this.maxAmount, this.enoughForFee, this.formSubmitted),
        });
      })
      .catch(() => { });
  }

  handleChange = (value: Object) => {
    this._form.getValue(); // NOTE: validate on every change
    this.setState({ value });
  };

  handleFormSubmit = () => {
    this.formSubmitted = true;
    this.setState({
      formStructure: getFormStructure(this.maxAmount, this.enoughForFee, this.formSubmitted),
    }, () => {
      const value = this._form.getValue();
      const { txFeeInWei } = this.state;
      const { navigation } = this.props;

      if (!value || !this.gasPriceFetched) return;

      const transactionPayload: TransactionPayload = {
        to: '',
        amount: parseNumber(value.amount),
        gasLimit,
        gasPrice: this.gasPrice.toNumber(),
        txFeeInWei: txFeeInWei ? txFeeInWei.toNumber() : 0,
        symbol: this.assetData.symbol,
        contractAddress: this.assetData.contractAddress,
      };
      navigation.navigate(SEND_TOKEN_CONTACTS, {
        assetData: this.assetData,
        transactionPayload,
      });
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

  calculateMaxAmount(token: string, balance: number, txFeeInWei: ?Object): number {
    if (token !== ETH) {
      return balance;
    }
    const maxAmount = utils.parseUnits(balance.toString(), 'ether').sub(txFeeInWei);
    if (maxAmount.lt(0)) return 0;
    return new BigNumber(utils.formatEther(maxAmount)).toNumber();
  }

  checkIfEnoughForFee(assets: Assets, txFeeInWei): boolean {
    if (!assets[ETH]) return false;
    const ethBalance = assets[ETH].balance;
    const balanceInWei = utils.parseUnits(ethBalance.toString(), 'ether');
    return balanceInWei.gte(txFeeInWei);
  }
  render() {
    const {
      value,
      formStructure,
      txFeeInWei,
    } = this.state;
    const { token, icon, balance } = this.assetData;
    const formOptions = generateFormOptions({ icon, currency: token });

    const layout = Platform.OS === 'ios' ?
      (
        <View>
          <ModalScreenHeader
            onClose={this.props.navigation.dismiss}
            rightLabelText="step 1 of 3"
            title="send"
          />
          <Container>
            <Wrapper regularPadding>
              <SubTitle>How much {token} would you like to send?</SubTitle>
              <Form
                ref={node => { this._form = node; }}
                type={formStructure}
                options={formOptions}
                value={value}
                onChange={this.handleChange}
              />
              <ActionsWrapper>
                <Paragraph style={{ marginRight: 24 }}>Balance {balance} {token}</Paragraph>
                <TouchableOpacity onPress={this.useMaxValue}>
                  <TextLink>Send All</TextLink>
                </TouchableOpacity>
              </ActionsWrapper>
            </Wrapper>
          </Container>
          <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={30}>
            <FooterWrapper>
              <Text>Fee <TextLink> {txFeeInWei && ` ${utils.formatEther(txFeeInWei.toString())} ETH`}</TextLink></Text>
              <ButtonMini title="Next" onPress={this.handleFormSubmit} />
            </FooterWrapper>
          </KeyboardAvoidingView>
        </View>
      ) :
      (
        <Container>
          <KeyboardAvoidingView behavior="padding">
            <View>
              <ModalScreenHeader
                onClose={this.props.navigation.dismiss}
                rightLabelText="step 1 of 3"
                title="send"
              />
              <BodyWrapper>
                <SubTitle>How much {token} would you like to send?</SubTitle>
                <Form
                  ref={node => { this._form = node; }}
                  type={formStructure}
                  options={formOptions}
                  value={value}
                  onChange={this.handleChange}
                />
                <ActionsWrapper>
                  <Paragraph style={{ marginRight: 24 }}>Balance {balance} {token}</Paragraph>
                  <TouchableOpacity onPress={this.useMaxValue}>
                    <TextLink>Send All</TextLink>
                  </TouchableOpacity>
                </ActionsWrapper>
              </BodyWrapper>
            </View>
            <FooterWrapper>
              <Text>Fee <TextLink> {txFeeInWei && ` ${utils.formatEther(txFeeInWei.toString())} ETH`}</TextLink></Text>
              <ButtonMini title="Next" onPress={this.handleFormSubmit} />
            </FooterWrapper>
          </KeyboardAvoidingView>
        </Container>
      );
    return (
      <React.Fragment>
        {layout}
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({ assets: { data: assets } }) => ({
  assets,
});

export default connect(mapStateToProps)(SendTokenAmount);
