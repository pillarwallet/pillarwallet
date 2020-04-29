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

// components
import { Wrapper } from 'components/Layout';
import Button from 'components/Button';
import { TextLink, Label, BaseText } from 'components/Typography';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import SlideModal from 'components/Modals/SlideModal';
import SendTokenDetails from 'components/SendTokenDetails';
import Spinner from 'components/Spinner';
import RelayerMigrationModal from 'components/RelayerMigrationModal';

// utils
import { formatAmount, formatFiat, formatTransactionFee } from 'utils/common';
import { fontStyles, spacing } from 'utils/variables';
import { getBalance, getRate, calculateMaxAmount, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { makeAmountForm, getAmountFormFields } from 'utils/formHelpers';
import { checkIfSmartWalletAccount } from 'utils/accounts';
import { calculateGasEstimate } from 'services/assets';
import smartWalletService from 'services/smartWallet';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { Account } from 'models/Account';
import type { GasInfo } from 'models/GasInfo';
import type { GasToken, TokenTransactionPayload, Transaction } from 'models/Transaction';
import type { Balances, Rates, AssetData, Assets } from 'models/Asset';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { SessionData } from 'models/Session';

// constants
import { SEND_TOKEN_CONFIRM } from 'constants/navigationConstants';
import { ETH, SPEED_TYPES, SPEED_TYPE_LABELS } from 'constants/assetsConstants';

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
`;

const BackgroundWrapper = styled.View`
  flexGrow: 1;
`;

type Props = {
  assetData: AssetData,
  receiver: string,
  receiverEnsName: string,
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
  gasToken: ?GasToken,
  accountAssets: Assets,
  accountHistory: Transaction[],
};

type State = {
  value: ?{
    amount: ?string,
  },
  showTransactionSpeedModal: boolean,
  gasLimit: number,
  gettingFee: boolean,
  calculatingMaxValue: boolean,
  inputHasError: boolean,
  txFeeInWei: BigNumber,
  submitPressed: boolean,
  feeByGasToken: boolean,
  showRelayerMigrationModal: boolean,
};

const { Form } = t.form;
const MIN_TX_AMOUNT = 0.000000000000000001;

class SendETHTokens extends React.Component<Props, State> {
  _form: t.form;
  formSubmitted: boolean = false;

  state = {
    value: null,
    showTransactionSpeedModal: false,
    gasLimit: 0,
    gettingFee: true,
    calculatingMaxValue: false,
    inputHasError: false,
    txFeeInWei: new BigNumber(0),
    submitPressed: false,
    feeByGasToken: false,
    showRelayerMigrationModal: false,
  };

  constructor(props: Props) {
    super(props);

    this.updateTxFee = debounce(this.updateTxFee, 500);
    this.updateGasLimitAndTxFee = debounce(this.updateGasLimitAndTxFee, 500);
    if (!isEmpty(props.gasToken)) this.state.feeByGasToken = true;
  }

  componentDidMount() {
    this.props.fetchGasInfo();
  }

  componentDidUpdate(prevProps: Props) {
    const { session, gasToken } = this.props;
    if (prevProps.session.isOnline !== session.isOnline && session.isOnline) {
      this.props.fetchGasInfo();
    }
    // if gas token was updated after switching to gas token relayer
    if (isEmpty(prevProps.gasToken) && !isEmpty(gasToken)) {
      this.handleChange();
    }
  }

  getTxSpeed = () => {
    return this.props.transactionSpeed || SPEED_TYPES.NORMAL;
  };

  handleGasPriceChange = (txSpeed: string) => () => {
    this.props.onUpdateTransactionSpeed(txSpeed);
    this.setState({
      showTransactionSpeedModal: false,
    });
  };

  handleChange = (value: ?Object) => {
    const { activeAccount } = this.props;
    let updateState = { gettingFee: true };
    if (!isEmpty(value)) updateState = { ...updateState, value };
    this.setState(updateState);
    this.checkFormInputErrors();
    if (activeAccount && checkIfSmartWalletAccount(activeAccount)) {
      this.updateTxFee();
      return;
    }
    const amount = parseFloat(get(value, 'amount', 0));
    this.updateGasLimitAndTxFee(amount);
  };

  handleFormSubmit = async () => {
    const { gasToken } = this.props;
    const { submitPressed, feeByGasToken, txFeeInWei } = this.state;
    if (submitPressed) return;

    this.formSubmitted = true;
    this.setState({ submitPressed: true });

    const value = this._form.getValue();
    if (!value) return;

    const {
      receiver,
      receiverEnsName,
      assetData,
      source,
      navigation,
      activeAccount,
    } = this.props;

    // $FlowFixMe
    let transactionPayload: TokenTransactionPayload = {
      to: receiver,
      receiverEnsName,
      amount: value.amount,
      txFeeInWei,
      symbol: assetData.token,
      contractAddress: assetData.contractAddress,
      decimals: assetData.decimals,
    };

    if (feeByGasToken) transactionPayload.gasToken = gasToken;

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
    const {
      balances,
      activeAccount,
      assetData,
      gasToken,
    } = this.props;
    const { calculatingMaxValue, feeByGasToken } = this.state;
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
    const parsedGasToken = feeByGasToken && !isEmpty(gasToken) ? gasToken : null;
    const maxAmount = calculateMaxAmount(token, balance, txFeeInWei, parsedGasToken);
    const amount = formatAmount(maxAmount);
    this.setState({
      ...updatedState,
      value: { amount },
      gettingFee: false,
      calculatingMaxValue: false,
      txFeeInWei,
    }, () => this.checkFormInputErrors());
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
    this.checkFormInputErrors();
  };

  updateGasLimitAndTxFee = (amount: number) => {
    this.getGasLimit(amount)
      .then(gasLimit => this.setState({ gasLimit }, () => this.updateTxFee()))
      .catch(() => null);
  };

  getSmartWalletTxFeeInWei = async (amount?: number): BigNumber => {
    const {
      gasInfo,
      receiver,
      assetData,
      gasToken,
    } = this.props;
    const { feeByGasToken } = this.state;
    const value = Number(amount || get(this.state, 'value.amount', 0));

    if (!value) return new BigNumber(0);

    const transaction = { recipient: receiver, value, gasToken };
    const { gasTokenCost, cost: ethCost } = await smartWalletService
      .estimateAccountTransaction(transaction, gasInfo, assetData)
      .catch(() => ({}));

    // check gas token used for estimation is present, otherwise fallback to ETH
    if (gasTokenCost && gasTokenCost.gt(0)) {
      // set that calculated by gas token if was reset
      if (!feeByGasToken) this.setState({ feeByGasToken: true });
      return gasTokenCost;
    }

    // reset to fee by eth because the calculation failed
    if (feeByGasToken) this.setState({ feeByGasToken: false });

    return ethCost;
  };

  renderRelayerMigrationButton = () => {
    return (
      <Button
        title="Pay fees with PLR"
        onPress={() => this.setState({ showRelayerMigrationModal: true })}
        secondary
        small
      />
    );
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
      showTransactionSpeedModal,
      gasLimit,
      gettingFee,
      calculatingMaxValue,
      inputHasError,
      txFeeInWei,
      submitPressed,
      feeByGasToken,
      showRelayerMigrationModal,
    } = this.state;
    const {
      session,
      balances,
      rates,
      activeAccount,
      assetData,
      fiatCurrency,
      gasToken,
      accountAssets,
      accountHistory,
    } = this.props;

    const isSmartAccount = activeAccount && checkIfSmartWalletAccount(activeAccount);

    const { token, iconColor, decimals } = assetData;
    const parsedGasToken = feeByGasToken && !isEmpty(gasToken) ? gasToken : null;
    const feeSymbol = get(parsedGasToken, 'symbol', ETH);

    // balance
    const balance = getBalance(balances, token);

    // value
    const currentValue = (!!value && !!parseFloat(value.amount)) ? parseFloat(value.amount) : 0;

    // fee
    const balanceCheckTransaction = {
      txFeeInWei,
      amount: currentValue,
      decimals,
      symbol: token,
      gasToken: parsedGasToken,
    };
    const isEnoughForFee = isEnoughBalanceForTransactionFee(balances, balanceCheckTransaction);
    const feeDisplayValue = formatTransactionFee(txFeeInWei, parsedGasToken);

    // max amount
    const maxAmount = calculateMaxAmount(token, balance, txFeeInWei, parsedGasToken);

    // value in fiat
    const valueInFiat = currentValue * getRate(rates, token, fiatCurrency);
    const valueInFiatOutput = formatFiat(valueInFiat, fiatCurrency);

    // form
    const formStructure = makeAmountForm(
      maxAmount,
      MIN_TX_AMOUNT,
      isEnoughForFee,
      this.formSubmitted,
      decimals,
      feeSymbol,
    );
    const formFields = getAmountFormFields({
      icon: iconColor,
      currency: token,
      valueInFiatOutput,
      customProps: { inputWrapperStyle: { marginTop: spacing.large } },
    });

    const enteredMoreThanBalance = currentValue > balance;
    const showNextButton = !submitPressed && !!value && !!parseFloat(value.amount) && !inputHasError;
    const showFee = !enteredMoreThanBalance && !gettingFee && !!txFeeInWei && txFeeInWei.gt(0);
    const isNextButtonDisabled = gettingFee || !session.isOnline;
    const nextButtonTitle = gettingFee
      ? 'Getting the fee..'
      : 'Next';

    const showRelayerMigration = showFee && isSmartAccount && isEmpty(gasToken);
    const showTransactionSpeeds = !inputHasError && !!gasLimit && !isSmartAccount && !showRelayerMigration;

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: `Send ${assetData.token}` }] }}
        footer={(
          <FooterInner>
            {!!showTransactionSpeeds &&
              <TouchableOpacity onPress={() => this.setState({ showTransactionSpeedModal: true })}>
                <SendTokenDetailsValue>
                  <Label small>Fee: </Label>
                  <TextLink>{SPEED_TYPE_LABELS[this.getTxSpeed()]}</TextLink>
                </SendTokenDetailsValue>
              </TouchableOpacity>
            }
            {!showTransactionSpeeds && !showRelayerMigration && showFee &&
              <SendTokenDetailsValue>
                <Label small>Estimated fee: {feeDisplayValue}</Label>
              </SendTokenDetailsValue>
            }
            {showFee && showRelayerMigration && this.renderRelayerMigrationButton()}
            {!showTransactionSpeeds && !showFee && !showRelayerMigration && <Label>&nbsp;</Label>}
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
                  <TextLink>Send all</TextLink>
                </TouchableOpacity>
              }
              {calculatingMaxValue && <Spinner width={20} height={20} />}
            </ActionsWrapper>
          </Wrapper>
        </BackgroundWrapper>
        {showTransactionSpeeds &&
          <SlideModal
            isVisible={showTransactionSpeedModal}
            title="Transaction speed"
            onModalHide={() => { this.setState({ showTransactionSpeedModal: false }); }}
          >
            <Label>Choose your gas price.</Label>
            <Label>Faster transaction requires more fee.</Label>
            <ButtonWrapper>{this.renderTxSpeedButtons()}</ButtonWrapper>
          </SlideModal>
        }
        {showRelayerMigration &&
          <RelayerMigrationModal
            isVisible={showRelayerMigrationModal}
            onModalHide={() => this.setState({ showRelayerMigrationModal: false })}
            accountAssets={accountAssets}
            accountHistory={accountHistory}
          />
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
