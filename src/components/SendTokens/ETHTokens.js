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
import debounce from 'lodash.debounce';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import { ethToWei } from '@netgum/utils';

// components
import { Wrapper } from 'components/Layout';
import Button from 'components/Button';
import { TextLink, Label, BaseText } from 'components/Typography';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import SlideModal from 'components/Modals/SlideModal';
import SendTokenDetails from 'components/SendTokenDetails';
import Spinner from 'components/Spinner';

// utils
import { formatAmount, formatFiat } from 'utils/common';
import { fontStyles, spacing, UIColors } from 'utils/variables';
import { getBalance, getRate, calculateMaxAmount, checkIfEnoughForFee } from 'utils/assets';
import { makeAmountForm, getAmountFormFields } from 'utils/formHelpers';
import { checkIfSmartWalletAccount } from 'utils/accounts';
import { calculateGasEstimate } from 'services/assets';
import smartWalletService from 'services/smartWallet';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { Account } from 'models/Account';
import type { GasInfo } from 'models/GasInfo';
import type { TokenTransactionPayload } from 'models/Transaction';
import type { Balances, Rates, AssetData } from 'models/Asset';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { SessionData } from 'models/Session';

// constants
import { SEND_TOKEN_CONFIRM } from 'constants/navigationConstants';
import { ETH, SPEED_TYPES } from 'constants/assetsConstants';

// actions
import { fetchGasInfoAction } from 'actions/historyActions';

const ActionsWrapper = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const SendTokenDetailsValue = styled(BaseText)`
  ${fontStyles.medium};
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
  padding: ${spacing.large}px;
  background-color: ${UIColors.defaultBackgroundColor};
`;

const BackgroundWrapper = styled.View`
  background-color: ${UIColors.defaultBackgroundColor};
  flexGrow: 1;
`;

type Props = {
  assetData: AssetData,
  receiver: string,
  source: string,
  navigation: NavigationScreenProp<*>,
  balances: Balances,
  session: SessionData,
  fetchGasInfo: () => void,
  gasInfo: GasInfo,
  rates: Rates,
  fiatCurrency: string,
  transactionSpeed: ?string,
  activeAccountAddress: string,
  activeAccount: ?Account,
  onUpdateTransactionSpeed: (speed: string) => void,
};

type State = {
  value: ?{
    amount: ?string,
  },
  showModal: boolean,
  gasLimit: number,
  gettingFee: boolean,
  calculatingMaxValue: boolean,
  inputHasError: boolean,
  txFeeInWei: BigNumber,
  submitPressed: boolean,
};

const { Form } = t.form;
const MIN_TX_AMOUNT = 0.000000000000000001;

const SPEED_TYPE_LABELS = {
  [SPEED_TYPES.SLOW]: 'Slow',
  [SPEED_TYPES.NORMAL]: 'Normal',
  [SPEED_TYPES.FAST]: 'Fast',
};

class SendETHTokens extends React.Component<Props, State> {
  _form: t.form;
  formSubmitted: boolean = false;

  state = {
    value: null,
    showModal: false,
    gasLimit: 0,
    gettingFee: true,
    calculatingMaxValue: false,
    inputHasError: false,
    txFeeInWei: 0,
    submitPressed: false,
  };

  constructor(props: Props) {
    super(props);

    this.updateTxFee = debounce(this.updateTxFee, 500);
    this.updateGasLimitAndTxFee = debounce(this.updateGasLimitAndTxFee, 500);
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
    this.props.onUpdateTransactionSpeed(txSpeed);
    this.setState({
      showModal: false,
    });
  };

  handleChange = (value: Object) => {
    const { activeAccount } = this.props;
    // first update the amount, then after state is updated check for errors
    this.setState({ value, gettingFee: true });
    this.checkFormInputErrors();
    if (activeAccount && checkIfSmartWalletAccount(activeAccount)) {
      this.updateTxFee();
      return;
    }
    const amount = parseFloat(get(value, 'amount', 0));
    this.updateGasLimitAndTxFee(amount);
  };

  handleFormSubmit = async () => {
    const { submitPressed } = this.state;
    if (submitPressed) return;
    this.formSubmitted = true;
    this.setState({ submitPressed: true });
    const value = this._form.getValue();
    if (!value) return;
    const { receiver, assetData, source } = this.props;
    const txFeeInWei = await this.getTxFeeInWei();
    // $FlowFixMe
    let transactionPayload: TokenTransactionPayload = {
      to: receiver,
      amount: value.amount,
      txFeeInWei,
      symbol: assetData.token,
      contractAddress: assetData.contractAddress,
      decimals: assetData.decimals,
    };
    const { navigation, activeAccount } = this.props;
    if (!activeAccount || !checkIfSmartWalletAccount(activeAccount)) {
      const { gasLimit } = this.state;
      const transactionSpeed = this.getTxSpeed();
      const gasPrice = txFeeInWei.div(gasLimit).toNumber();
      transactionPayload = {
        ...transactionPayload,
        gasPrice,
        gasLimit,
        txSpeed: transactionSpeed,
      };
    }
    Keyboard.dismiss();
    this.setState({ submitPressed: false }, () => {
      navigation.navigate(SEND_TOKEN_CONFIRM, {
        transactionPayload,
        source,
      });
    });
  };

  useMaxValue = async () => {
    const { balances, activeAccount, assetData } = this.props;
    const { calculatingMaxValue } = this.state;
    if (calculatingMaxValue) return;
    this.setState({ calculatingMaxValue: true, gettingFee: true });
    const { token } = assetData;
    const balance = getBalance(balances, token);
    const updatedState = {};
    let txFeeInWei;
    if (activeAccount && checkIfSmartWalletAccount(activeAccount)) {
      txFeeInWei = await this.getSmartWalletTxFeeInWei(balance);
    } else {
      updatedState.gasLimit = await this.getGasLimit(balance); // calculate gas limit for max available balance
      const transactionSpeed = this.getTxSpeed();
      txFeeInWei = this.getTxFeeInWei(transactionSpeed, updatedState.gasLimit);
    }
    const maxAmount = calculateMaxAmount(token, balance, txFeeInWei);
    const amount = formatAmount(maxAmount);
    this.setState({
      ...updatedState,
      value: { amount },
      gettingFee: false,
      calculatingMaxValue: false,
      txFeeInWei,
    });
    this.checkFormInputErrors();
  };

  getGasLimit = (amount: number) => {
    const {
      assetData: {
        token: symbol,
        contractAddress,
        decimals,
      },
      receiver,
    } = this.props;

    // cannot be set if value is zero or not present, fee select will be hidden
    if (!amount) return Promise.resolve(0);

    const { activeAccountAddress } = this.props;

    return calculateGasEstimate({
      from: activeAccountAddress,
      to: receiver,
      amount,
      symbol,
      contractAddress,
      decimals,
    });
  };

  getTxFeeInWei = (txSpeed?: string, gasLimit?: number): BigNumber => {
    const { gasInfo, activeAccount } = this.props;
    if (activeAccount && checkIfSmartWalletAccount(activeAccount)) {
      return this.getSmartWalletTxFeeInWei();
    }
    txSpeed = txSpeed || this.getTxSpeed();
    // calculate either with gasLimit in state or provided as param
    if (!gasLimit) {
      ({ gasLimit } = this.state);
    }
    const gasPrice = gasInfo.gasPrice[txSpeed] || 0;
    const gasPriceWei = utils.parseUnits(gasPrice.toString(), 'gwei');
    return gasPriceWei.mul(gasLimit);
  };

  updateTxFee = async () => {
    const txFeeInWei = await this.getTxFeeInWei();
    this.setState({ txFeeInWei, gettingFee: false });
  };

  updateGasLimitAndTxFee = (amount: number) => {
    this.getGasLimit(amount)
      .then(gasLimit => this.setState({ gasLimit }, () => this.updateTxFee()))
      .catch(() => null);
  };

  getSmartWalletTxFeeInWei = (amount?: number): BigNumber => {
    const { gasInfo, receiver } = this.props;
    const value = amount || get(this.state, 'value.amount', 0);
    return smartWalletService.estimateAccountTransaction({
      recipient: receiver,
      value: ethToWei(value),
    }, gasInfo).catch(() => 0);
  };

  renderTxSpeedButtons = () => {
    const { rates, fiatCurrency, activeAccount } = this.props;
    if (activeAccount && checkIfSmartWalletAccount(activeAccount)) return null;
    return Object.keys(SPEED_TYPE_LABELS).map(txSpeed => {
      const feeInEth = formatAmount(utils.formatEther(this.getTxFeeInWei(txSpeed)));
      const feeInFiat = parseFloat(feeInEth) * getRate(rates, ETH, fiatCurrency);
      const formattedFeeInFiat = formatFiat(feeInFiat, fiatCurrency);
      return (
        <Btn
          key={txSpeed}
          primaryInverted
          onPress={this.handleGasPriceChange(txSpeed)}
        >
          <TextLink>{SPEED_TYPE_LABELS[txSpeed]} - {feeInEth} ETH</TextLink>
          <Label>{formattedFeeInFiat}</Label>
        </Btn>
      );
    });
  };

  checkFormInputErrors = () => {
    if (!this._form) return;
    const { inputHasError } = this.state;
    if (!isEmpty(get(this._form.validate(), 'errors'))) {
      this.setState({ inputHasError: true });
    } else if (inputHasError) {
      this.setState({ inputHasError: false });
    }
  };

  render() {
    const {
      value,
      showModal,
      gasLimit,
      gettingFee,
      calculatingMaxValue,
      inputHasError,
      txFeeInWei,
      submitPressed,
    } = this.state;
    const {
      session,
      balances,
      rates,
      activeAccount,
      assetData,
      fiatCurrency,
    } = this.props;

    const isSmartAccount = activeAccount && checkIfSmartWalletAccount(activeAccount);
    const showTransactionSpeeds = !inputHasError && !!gasLimit && !isSmartAccount;
    const transactionSpeed = showTransactionSpeeds && this.getTxSpeed();
    const { token, icon, decimals } = assetData;

    // balance
    const balance = getBalance(balances, token);

    // fee
    const isEnoughForFee = checkIfEnoughForFee(balances, txFeeInWei);

    // max amount
    const maxAmount = calculateMaxAmount(token, balance, txFeeInWei);

    // value
    const currentValue = (!!value && !!parseFloat(value.amount)) ? parseFloat(value.amount) : 0;

    // value in fiat
    const valueInFiat = currentValue * getRate(rates, token, fiatCurrency);
    const valueInFiatOutput = formatFiat(valueInFiat, fiatCurrency);

    // form
    const formStructure = makeAmountForm(maxAmount, MIN_TX_AMOUNT, isEnoughForFee, this.formSubmitted, decimals);
    const formFields = getAmountFormFields({ icon, currency: token, valueInFiatOutput });

    const showNextButton = !submitPressed && !!value && !!parseFloat(value.amount) && !inputHasError;
    const isNextButtonDisabled = gettingFee || !session.isOnline;
    const nextButtonTitle = gettingFee
      ? 'Getting the fee..'
      : 'Next';

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: `Send ${assetData.token}` }] }}
        keyboardAvoidFooter={(
          <FooterInner>
            {!!transactionSpeed &&
            <TouchableOpacity onPress={() => this.setState({ showModal: true })}>
              <SendTokenDetailsValue>
                <Label small>Fee: </Label>
                <TextLink>{SPEED_TYPE_LABELS[transactionSpeed]}</TextLink>
              </SendTokenDetailsValue>
            </TouchableOpacity>
            }
            {!showTransactionSpeeds && <Label>&nbsp;</Label>}
            {showNextButton &&
              <Button
                disabled={isNextButtonDisabled}
                small
                flexRight
                title={nextButtonTitle}
                onPress={this.handleFormSubmit}
              />
            }
            {submitPressed && <Spinner width={20} height={20} />}
          </FooterInner>
        )}
        minAvoidHeight={200}
      >
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
              <SendTokenDetails
                rates={rates}
                fiatCurrency={fiatCurrency}
                balance={balance}
                token={token}
              />
              {!calculatingMaxValue &&
                <TouchableOpacity onPress={this.useMaxValue}>
                  <TextLink>Send All</TextLink>
                </TouchableOpacity>
              }
              {calculatingMaxValue && <Spinner width={20} height={20} />}
            </ActionsWrapper>
          </Wrapper>
        </BackgroundWrapper>
        {showTransactionSpeeds &&
          <SlideModal
            isVisible={showModal}
            title="Transaction speed"
            onModalHide={() => { this.setState({ showModal: false }); }}
          >
            <Label>Choose your gas price.</Label>
            <Label>Faster transaction requires more fee.</Label>
            <ButtonWrapper>{this.renderTxSpeedButtons()}</ButtonWrapper>
          </SlideModal>
        }
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  history: { gasInfo },
}: RootReducerState): $Shape<Props> => ({
  gasInfo,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(SendETHTokens);
