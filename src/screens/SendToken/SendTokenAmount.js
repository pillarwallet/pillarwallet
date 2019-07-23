// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import { connect } from 'react-redux';
import { TouchableOpacity, Keyboard } from 'react-native';
import t from 'tcomb-form-native';
import { utils } from 'ethers';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';

// components
import { Container, Footer, Wrapper } from 'components/Layout';
import Button from 'components/Button';
import { TextLink, Label, BaseText } from 'components/Typography';
import Header from 'components/Header';
import SlideModal from 'components/Modals/SlideModal';

// utils
import { formatAmount, getCurrencySymbol, formatMoney } from 'utils/common';
import { baseColors, fontSizes, spacing, UIColors } from 'utils/variables';
import { getBalance, getRate, calculateMaxAmount, checkIfEnoughForFee } from 'utils/assets';
import { makeAmountForm, getAmountFormFields } from 'utils/formHelpers';
import { calculateGasEstimate } from 'services/assets';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { GasInfo } from 'models/GasInfo';
import type { TokenTransactionPayload } from 'models/Transaction';
import type { Balances, Rates } from 'models/Asset';

// constants
import { SEND_TOKEN_CONFIRM } from 'constants/navigationConstants';
import { ETH, defaultFiatCurrency, SPEED_TYPES } from 'constants/assetsConstants';

// actions
import { fetchGasInfoAction } from 'actions/historyActions';
import { updateAppSettingsAction } from 'actions/appSettingsActions';

// selectors
import { accountBalancesSelector } from 'selectors/balances';


const ActionsWrapper = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const SendTokenDetails = styled.View``;

const SendTokenDetailsValue = styled(BaseText)`
  font-size: ${fontSizes.small};
  margin-bottom: 8px;
`;

const HelperText = styled(BaseText)`
  font-size: ${fontSizes.small};
  margin-bottom: ${spacing.rhythm / 2}px;
  color: ${UIColors.placeholderTextColor};
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

const FooterInner = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
`;

const BackgroundWrapper = styled.View`
  background-color: ${UIColors.defaultBackgroundColor};
  flex: 1;
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
  transactionSpeed: string,
  updateAppSettings: Function,
  fromAddress: string,
};

type State = {
  value: ?{
    amount: ?string,
  },
  showModal: boolean,
  gasLimit: number,
};

const { Form } = t.form;
const MIN_TX_AMOUNT = 0.000000000000000001;

const SPEED_TYPE_LABELS = {
  [SPEED_TYPES.SLOW]: 'Slow',
  [SPEED_TYPES.NORMAL]: 'Normal',
  [SPEED_TYPES.FAST]: 'Fast',
};

class SendTokenAmount extends React.Component<Props, State> {
  _form: t.form;
  assetData: Object;
  formSubmitted: boolean = false;
  enoughForFee: boolean = false;
  receiver: string;
  source: string;

  constructor(props: Props) {
    super(props);
    this.assetData = this.props.navigation.getParam('assetData', {});
    this.receiver = this.props.navigation.getParam('receiver', '');
    this.source = this.props.navigation.getParam('source', '');

    this.state = {
      value: null,
      showModal: false,
      gasLimit: 0,
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

  getTxSpeed = () => {
    return this.props.transactionSpeed || SPEED_TYPES.NORMAL;
  };

  handleGasPriceChange = (txSpeed: string) => () => {
    this.props.updateAppSettings('transactionSpeed', txSpeed);
    this.setState({
      showModal: false,
    });
  };

  handleChange = async (value: Object) => {
    const gasLimit = await this.getGasLimit();
    this.setState({ value, gasLimit });
  };

  handleFormSubmit = () => {
    this.formSubmitted = true;
    const txFeeInWei = this.getTxFeeInWei();
    const value = this._form.getValue();
    const { navigation } = this.props;
    const { gasLimit } = this.state;
    const transactionSpeed = this.getTxSpeed();
    const gasPrice = txFeeInWei.div(gasLimit).toNumber();
    if (!value) return;
    const transactionPayload: TokenTransactionPayload = {
      to: this.receiver,
      amount: value.amount,
      gasLimit,
      gasPrice,
      txFeeInWei,
      txSpeed: transactionSpeed,
      symbol: this.assetData.token,
      contractAddress: this.assetData.contractAddress,
      decimals: this.assetData.decimals,
    };

    Keyboard.dismiss();
    navigation.navigate(SEND_TOKEN_CONFIRM, {
      transactionPayload,
      source: this.source,
    });
  };

  useMaxValue = async () => {
    const { balances } = this.props;
    const { token } = this.assetData;
    const balance = getBalance(balances, token);
    const gasLimit = await this.getGasLimit(balance); // calculate gas limit for max available balance
    const transactionSpeed = this.getTxSpeed();
    const txFeeInWei = this.getTxFeeInWei(transactionSpeed, gasLimit);
    const maxAmount = calculateMaxAmount(token, balance, txFeeInWei);
    this.enoughForFee = checkIfEnoughForFee(balances, txFeeInWei);
    const amount = formatAmount(maxAmount);
    this.setState({
      gasLimit,
      value: { amount },
    });
  };

  getGasLimit = (amount?: number) => {
    // calculate either with amount in form or provided as param
    if (!amount) {
      ({ amount = 0 } = this._form.getValue() || {});
    }
    const {
      token: symbol,
      contractAddress,
      decimals,
    } = this.assetData;

    // cannot be set if value is zero, fee select will be hidden
    if (amount === 0) return 0;

    return calculateGasEstimate({
      from: this.props.fromAddress,
      to: this.receiver,
      amount,
      symbol,
      contractAddress,
      decimals,
    });
  };

  getTxFeeInWei = (txSpeed?: string, gasLimit?: number): BigNumber => {
    txSpeed = txSpeed || this.getTxSpeed();
    const { gasInfo } = this.props;
    // calculate either with gasLimit in state or provided as param
    if (!gasLimit) {
      ({ gasLimit } = this.state);
    }
    const gasPrice = gasInfo.gasPrice[txSpeed] || 0;
    const gasPriceWei = utils.parseUnits(gasPrice.toString(), 'gwei');
    return gasPriceWei.mul(gasLimit);
  };

  renderTxSpeedButtons = () => {
    const { rates, baseFiatCurrency } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    return Object.keys(SPEED_TYPE_LABELS).map(txSpeed => {
      const feeInEth = formatAmount(utils.formatEther(this.getTxFeeInWei(txSpeed)));
      const feeInFiat = parseFloat(feeInEth) * getRate(rates, ETH, fiatCurrency);
      return (
        <Btn
          key={txSpeed}
          primaryInverted
          onPress={this.handleGasPriceChange(txSpeed)}
        >
          <TextLink>{SPEED_TYPE_LABELS[txSpeed]} - {feeInEth} ETH</TextLink>
          <Label>{`${getCurrencySymbol(fiatCurrency)}${feeInFiat.toFixed(2)}`}</Label>
        </Btn>
      );
    });
  };

  render() {
    const { value, showModal, gasLimit } = this.state;
    const {
      session,
      balances,
      gasInfo,
      rates,
      baseFiatCurrency,
    } = this.props;

    const transactionSpeed = this.getTxSpeed();
    const { token, icon, decimals } = this.assetData;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const currencySymbol = getCurrencySymbol(fiatCurrency);

    // balance
    const balance = getBalance(balances, token);
    const formattedBalance = formatAmount(balance);

    // balance in fiat
    const totalInFiat = balance * getRate(rates, token, fiatCurrency);
    const formattedBalanceInFiat = formatMoney(totalInFiat);

    // fee
    const txFeeInWei = this.getTxFeeInWei();
    const isEnoughForFee = checkIfEnoughForFee(balances, txFeeInWei);

    // max amount
    const maxAmount = calculateMaxAmount(token, balance, txFeeInWei);

    // value
    const currentValue = (!!value && !!parseFloat(value.amount)) ? parseFloat(value.amount) : 0;

    // value in fiat
    const valueInFiat = currentValue * getRate(rates, token, fiatCurrency);
    const formattedValueInFiat = formatMoney(valueInFiat);
    const valueInFiatOutput = `${currencySymbol}${formattedValueInFiat}`;

    // form
    const formStructure = makeAmountForm(maxAmount, MIN_TX_AMOUNT, isEnoughForFee, this.formSubmitted, decimals);
    const formFields = getAmountFormFields({ icon, currency: token, valueInFiatOutput });

    return (
      <Container color={baseColors.white}>
        <Header
          onBack={() => this.props.navigation.goBack(null)}
          title={`send ${this.assetData.token}`}
          white
        />
        <BackgroundWrapper>
          <Wrapper regularPadding>
            <Form
              ref={node => { this._form = node; }}
              type={formStructure}
              options={formFields}
              value={value}
              onChange={this.handleChange}
            />
            <ActionsWrapper>
              <SendTokenDetails>
                <Label small>Available Balance</Label>
                <SendTokenDetailsValue>
                  {formattedBalance} {token}
                  <HelperText> ({currencySymbol}{formattedBalanceInFiat})</HelperText>
                </SendTokenDetailsValue>
              </SendTokenDetails>
              <TouchableOpacity onPress={this.useMaxValue}>
                <TextLink>Send All</TextLink>
              </TouchableOpacity>
            </ActionsWrapper>
          </Wrapper>
        </BackgroundWrapper>
        <Footer keyboardVerticalOffset={35} backgroundColor={UIColors.defaultBackgroundColor}>
          <FooterInner>
            {!!gasLimit &&
              <TouchableOpacity onPress={() => this.setState({ showModal: true })}>
                <SendTokenDetailsValue>
                  <Label small>Fee:</Label>
                  <TextLink> {SPEED_TYPE_LABELS[transactionSpeed]}</TextLink>
                </SendTokenDetailsValue>
              </TouchableOpacity>
            }
            {!!value && !!parseFloat(value.amount) &&
              <Button
                disabled={!session.isOnline || !gasInfo.isFetched}
                small
                flexRight
                title="Next"
                onPress={this.handleFormSubmit}
              />
            }
          </FooterInner>
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
  session: { data: session },
  rates: { data: rates },
  history: { gasInfo },
  appSettings: { data: { baseFiatCurrency, transactionSpeed } },
  wallet: { data: { address: fromAddress } },
}) => ({
  rates,
  session,
  gasInfo,
  baseFiatCurrency,
  transactionSpeed,
  fromAddress,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
  updateAppSettings: (path, value) => dispatch(updateAppSettingsAction(path, value)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendTokenAmount);
