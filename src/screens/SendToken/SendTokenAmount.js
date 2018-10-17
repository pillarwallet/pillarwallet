// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { TouchableOpacity, Keyboard } from 'react-native';
import t from 'tcomb-form-native';
import { utils } from 'ethers';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';

// components
import { Container, Footer, Wrapper } from 'components/Layout';
import SingleInput from 'components/TextInput/SingleInput';
import Button from 'components/Button';
import { TextLink, Label, BaseText } from 'components/Typography';
import Header from 'components/Header';
import SlideModal from 'components/Modals/SlideModal';

// utils
import { parseNumber, formatAmount, isValidNumber, getCurrencySymbol, formatMoney } from 'utils/common';
import { fontSizes, spacing, UIColors } from 'utils/variables';
import { getBalance } from 'utils/assets';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { GasInfo } from 'models/GasInfo';
import type { TransactionPayload } from 'models/Transaction';
import type { Balances, Rates } from 'models/Asset';

// constants
import { SEND_TOKEN_CONFIRM } from 'constants/navigationConstants';
import { ETH, defaultFiatCurrency } from 'constants/assetsConstants';

// actions
import { fetchGasInfoAction } from 'actions/historyActions';


const { Form } = t.form;
const GAS_LIMIT = 500000;
const MIN_TX_AMOUNT = 0.000000000000000001;

const getFormStructure = (maxAmount: number, minAmount: number, enoughForFee: boolean, formSubmitted: boolean) => {
  const Amount = t.refinement(t.String, (amount): boolean => {
    if (!isValidNumber(amount.toString())) return false;

    amount = parseNumber(amount.toString());
    const isValid = enoughForFee && amount <= maxAmount && amount >= minAmount;

    if (formSubmitted) return isValid && amount > 0;
    return isValid;
  });

  Amount.getValidationErrorMessage = (amount): string => {
    if (!isValidNumber(amount.toString())) {
      return 'Incorrect number entered.';
    }

    amount = parseNumber(amount.toString());
    if (!enoughForFee) {
      return 'Not enough ETH to process the transaction fee';
    } else if (amount >= maxAmount) {
      return 'Amount should not exceed the sum of total balance and est. network fee';
    } else if (amount < minAmount) {
      return 'Amount should be greater than 1 Wei (0.000000000000000001 ETH)';
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
    keyboardType: 'decimal-pad',
    textAlign: 'right',
    autoCapitalize: 'words',
  };

  return (
    <SingleInput
      innerImageURI={icon}
      errorMessage={errorMessage}
      id="amount"
      inputProps={inputProps}
      inlineLabel
      fontSize={fontSizes.giant}
    />
  );
}

const generateFormOptions = (config: Object): Object => ({
  fields: {
    amount: {
      template: AmountInputTemplate,
      config,
      transformer: {
        parse: (str = '') => str.toString().replace(/,/g, '.'),
        format: (value = '') => value.toString().replace(/,/g, '.'),
      },
    },
  },
});

const ActionsWrapper = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const SendTokenDetails = styled.View``;

const SendTokenDetailsValue = styled(BaseText)`
  font-size: ${fontSizes.small};
  margin-bottom: ${spacing.rhythm / 2}px;
`;

const ButtonWrapper = styled.View`
  margin-top: ${spacing.rhythm / 2}px;
  margin-bottom: ${spacing.rhythm + 10}px;
`;

const Btn = styled(Button)`
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
`;

type Props = {
  token: string;
  address: string,
  totalBalance: number,
  contractAddress: string,
  navigation: NavigationScreenProp<*>,
  isVisible: boolean,
  formValues?: Object,
  balances: Balances,
  session: Object,
  fetchGasInfo: Function,
  gasInfo: GasInfo,
  rates: Rates,
  baseFiatCurrency: string,
}

type State = {
  value: ?{
    amount: ?string,
  },
  transactionSpeed: string,
  showModal: boolean,
}

const SLOW = 'min';
const NORMAL = 'avg';
const FAST = 'max';

const SPEED_TYPES = {
  [SLOW]: 'Slow',
  [NORMAL]: 'Normal',
  [FAST]: 'Fast',
};

class SendTokenAmount extends React.Component<Props, State> {
  _form: t.form;
  assetData: Object;
  formSubmitted: boolean = false;
  enoughForFee: boolean = false;
  receiver: string;

  constructor(props: Props) {
    super(props);
    this.assetData = this.props.navigation.getParam('assetData', {});
    this.receiver = this.props.navigation.getParam('receiver', '');
    this.state = {
      value: null,
      transactionSpeed: NORMAL,
      showModal: false,
    };
  }

  componentDidMount() {
    this.props.fetchGasInfo();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.session.isOnline !== this.props.session.isOnline && this.props.session.isOnline) {
      this.props.fetchGasInfo();
    }
  }

  handleGasPriceChange = (txSpeed: string) => () => {
    this.setState({
      transactionSpeed: txSpeed,
      showModal: false,
    });
  };

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  handleFormSubmit = () => {
    this.formSubmitted = true;
    const txFeeInWei = this.getTxFeeInWei();
    const value = this._form.getValue();
    const { navigation } = this.props;
    const gasPrice = txFeeInWei.div(GAS_LIMIT).toNumber();
    if (!value) return;
    const transactionPayload: TransactionPayload = {
      to: this.receiver,
      amount: value.amount,
      gasLimit: GAS_LIMIT,
      gasPrice,
      txFeeInWei,
      symbol: this.assetData.token,
      contractAddress: this.assetData.contractAddress,
      decimals: this.assetData.decimals,
    };

    Keyboard.dismiss();
    navigation.navigate(SEND_TOKEN_CONFIRM, {
      transactionPayload,
    });
  };

  useMaxValue = () => {
    const txFeeInWei = this.getTxFeeInWei();
    const { balances } = this.props;
    const { token } = this.assetData;
    const balance = getBalance(balances, token);
    const maxAmount = this.calculateMaxAmount(token, balance, txFeeInWei);
    this.enoughForFee = this.checkIfEnoughForFee(balances, txFeeInWei);
    this.setState({
      value: {
        amount: formatAmount(maxAmount),
      },
    });
  };

  calculateMaxAmount(token: string, balance: number | string, txFeeInWei: ?Object): number {
    if (typeof balance !== 'string') {
      balance = balance.toString();
    }
    if (token !== ETH) {
      return +balance;
    }
    const maxAmount = utils.parseUnits(balance, 'ether').sub(txFeeInWei);
    if (maxAmount.lt(0)) return 0;
    return new BigNumber(utils.formatEther(maxAmount)).toNumber();
  }

  checkIfEnoughForFee(balances: Balances, txFeeInWei): boolean {
    if (!balances[ETH]) return false;
    const ethBalance = getBalance(balances, ETH);
    const balanceInWei = utils.parseUnits(ethBalance.toString(), 'ether');
    return balanceInWei.gte(txFeeInWei);
  }

  getTxFeeInWei = (txSpeed?: string) => {
    txSpeed = txSpeed || this.state.transactionSpeed;
    const { gasInfo } = this.props;
    const gasPrice = gasInfo.gasPrice[txSpeed] || 0;
    const gasPriceWei = utils.parseUnits(gasPrice.toString(), 'gwei');
    return gasPriceWei.mul(GAS_LIMIT);
  };

  renderTxSpeedButtons = () => {
    const { rates, baseFiatCurrency } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    return Object.keys(SPEED_TYPES).map(txSpeed => {
      const feeInEth = formatAmount(utils.formatEther(this.getTxFeeInWei(txSpeed)));
      const feeInFiat = parseFloat(feeInEth) * rates[ETH][fiatCurrency];
      return (
        <Btn
          key={txSpeed}
          primaryInverted
          onPress={this.handleGasPriceChange(txSpeed)}
        >
          <TextLink>{SPEED_TYPES[txSpeed]} - {feeInEth} ETH</TextLink>
          <Label>{`${getCurrencySymbol(fiatCurrency)}${feeInFiat.toFixed(2)}`}</Label>
        </Btn>
      );
    });
  };

  render() {
    const {
      value,
      showModal,
      transactionSpeed,
    } = this.state;
    const {
      session,
      balances,
      gasInfo,
      rates,
      baseFiatCurrency,
    } = this.props;
    const { token, icon } = this.assetData;
    const balance = getBalance(balances, token);
    const formattedBalance = formatAmount(balance);
    const formOptions = generateFormOptions({ icon, currency: token });
    const txFeeInWei = this.getTxFeeInWei();
    const txFeeInEth = formatAmount(utils.formatEther(txFeeInWei));
    const maxAmount = this.calculateMaxAmount(token, balance, txFeeInWei);
    const isEnoughForFee = this.checkIfEnoughForFee(balances, txFeeInWei);
    const formStructure = getFormStructure(maxAmount, MIN_TX_AMOUNT, isEnoughForFee, this.formSubmitted);
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const totalInFiat = rates[token] ? balance * rates[token][fiatCurrency] : 0;
    const formattedBalanceInFiat = formatMoney(totalInFiat);
    const currencySymbol = getCurrencySymbol(fiatCurrency);
    return (
      <Container color={UIColors.defaultBackgroundColor}>
        <Header
          onBack={() => this.props.navigation.goBack(null)}
          title={`send ${this.assetData.token}`}
        />
        <Wrapper regularPadding>
          <Form
            ref={node => { this._form = node; }}
            type={formStructure}
            options={formOptions}
            value={value}
            onChange={this.handleChange}
          />
          <ActionsWrapper>
            <SendTokenDetails>
              <Label small>Available Balance</Label>
              <SendTokenDetailsValue>
                {formattedBalance} {token} ({currencySymbol}{formattedBalanceInFiat})
              </SendTokenDetailsValue>
              <Label small>Est. Network Fee</Label>
              <TouchableOpacity onPress={() => this.setState({ showModal: true })}>
                <SendTokenDetailsValue>
                  {txFeeInEth || 0} ETH
                  <TextLink> ({SPEED_TYPES[transactionSpeed]})</TextLink>
                </SendTokenDetailsValue>
              </TouchableOpacity>
            </SendTokenDetails>
            <TouchableOpacity onPress={this.useMaxValue}>
              <TextLink>Send All</TextLink>
            </TouchableOpacity>
          </ActionsWrapper>
        </Wrapper>
        <Footer keyboardVerticalOffset={35}>
          <Button
            disabled={!session.isOnline || !gasInfo.isFetched}
            small
            flexRight
            title="Next"
            onPress={this.handleFormSubmit}
          />
        </Footer>
        <SlideModal
          isVisible={showModal}
          title="transaction speed"
          onModalHide={() => { this.setState({ showModal: false }); }}
        >
          <Label>Choose your gas price.</Label>
          <Label>Faster transaction requires more fee.</Label>
          <ButtonWrapper>{this.renderTxSpeedButtons()}</ButtonWrapper>
        </SlideModal>
      </Container>
    );
  }
}

const mapStateToProps = ({
  assets: { balances },
  session: { data: session },
  rates: { data: rates },
  history: { gasInfo },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  rates,
  balances,
  session,
  gasInfo,
  baseFiatCurrency,
});

const mapDispatchToProps = (dispatch) => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(SendTokenAmount);
