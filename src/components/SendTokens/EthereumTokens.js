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
import isEqual from 'lodash.isequal';
import { createStructuredSelector } from 'reselect';

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
import { buildTxFeeInfo } from 'utils/smartWallet';

// services
import { calculateGasEstimate } from 'services/assets';
import smartWalletService from 'services/smartWallet';

// selectors
import {
  isActiveAccountSmartWalletSelector,
  isGasTokenSupportedSelector,
  useGasTokenSelector,
} from 'selectors/smartWallet';
import { activeAccountAddressSelector } from 'selectors';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { GasInfo } from 'models/GasInfo';
import type { TokenTransactionPayload, Transaction, TransactionFeeInfo } from 'models/Transaction';
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
  onUpdateTransactionSpeed: (speed: string) => void,
  accountAssets: Assets,
  accountHistory: Transaction[],
  isGasTokenSupported: boolean,
  isSmartAccount: boolean,
  useGasToken: boolean,
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
  txFeeInfo: ?TransactionFeeInfo,
  submitPressed: boolean,
  showRelayerMigrationModal: boolean,
};


const { Form } = t.form;
const MIN_TX_AMOUNT = 0.000000000000000001;


class SendEthereumTokens extends React.Component<Props, State> {
  _form: t.form;
  formSubmitted: boolean = false;

  state = {
    value: null,
    showTransactionSpeedModal: false,
    gasLimit: 0,
    gettingFee: true,
    calculatingMaxValue: false,
    inputHasError: false,
    txFeeInfo: null,
    submitPressed: false,
    showRelayerMigrationModal: false,
  };

  constructor(props: Props) {
    super(props);

    this.updateTxFee = debounce(this.updateTxFee, 500);
    this.updateKeyWalletGasLimitAndTxFee = debounce(this.updateKeyWalletGasLimitAndTxFee, 500);
  }

  componentDidMount() {
    if (!this.props.isSmartAccount) {
      this.props.fetchGasInfo();
    }
  }

  componentDidUpdate(prevProps: Props) {
    const {
      session, useGasToken, gasInfo, isSmartAccount, isGasTokenSupported,
    } = this.props;
    const { showRelayerMigrationModal } = this.state;

    if (prevProps.session.isOnline !== session.isOnline && session.isOnline && !isSmartAccount) {
      this.props.fetchGasInfo();
    }

    if (prevProps.isGasTokenSupported !== isGasTokenSupported && isGasTokenSupported && showRelayerMigrationModal) {
      this.setState({ showRelayerMigrationModal: false }); // eslint-disable-line
    }

    // do nothing if value is not set yet
    if (this.state.value === null) return;

    // if gas token was updated after switching to gas token relayer or gasInfo updated
    if (prevProps.useGasToken !== useGasToken || !isEqual(prevProps.gasInfo, gasInfo)) {
      this.handleAmountChange();
    }
  }

  getTxSpeed = () => {
    return this.props.transactionSpeed || SPEED_TYPES.NORMAL;
  };

  handleTxSpeedChange = (txSpeed: string) => () => {
    this.props.onUpdateTransactionSpeed(txSpeed);
    this.setState({ showTransactionSpeedModal: false });
  };

  handleAmountChange = (value: ?Object) => {
    const { isSmartAccount } = this.props;
    let updateState = { gettingFee: true };
    if (!isEmpty(value)) updateState = { ...updateState, value };

    this.setState(updateState);
    this.checkFormInputErrors();

    if (isSmartAccount) {
      this.updateTxFee();
      return;
    }

    const amount = parseFloat(get(value, 'amount', 0));
    this.updateKeyWalletGasLimitAndTxFee(amount);
  };

  updateTxFee = async () => {
    const { isSmartAccount } = this.props;

    const txFeeInfo = isSmartAccount
      ? await this.getSmartWalletTxFee()
      : this.getKeyWalletTxFee();

    this.setState({ txFeeInfo, gettingFee: false });
    this.checkFormInputErrors();
  };

  handleFormSubmit = async () => {
    const { submitPressed, txFeeInfo, gasLimit } = this.state;
    if (submitPressed || !txFeeInfo) return;

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
      isSmartAccount,
    } = this.props;

    // $FlowFixMe
    let transactionPayload: TokenTransactionPayload = {
      to: receiver,
      receiverEnsName,
      amount: value.amount,
      txFeeInWei: txFeeInfo.fee,
      symbol: assetData.token,
      contractAddress: assetData.contractAddress,
      decimals: assetData.decimals,
    };

    if (txFeeInfo.gasToken) transactionPayload.gasToken = txFeeInfo.gasToken;

    if (!isSmartAccount) {
      const transactionSpeed = this.getTxSpeed();
      const gasPrice = gasLimit ? txFeeInfo.fee.div(gasLimit).toNumber() : 0;
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
    const { balances, isSmartAccount, assetData } = this.props;
    const { calculatingMaxValue } = this.state;

    if (calculatingMaxValue) return;

    this.setState({ calculatingMaxValue: true, gettingFee: true, inputHasError: false }, async () => {
      const { token } = assetData;
      const balance = getBalance(balances, token);
      const updatedState = {};
      let txFeeInfo;

      if (isSmartAccount) {
        txFeeInfo = await this.getSmartWalletTxFee(balance);
      } else {
        const gasLimit = await this.getGasLimitForKeyWallet(balance); // calculate gas limit for max available balance
        const transactionSpeed = this.getTxSpeed();
        txFeeInfo = this.getKeyWalletTxFee(transactionSpeed, gasLimit);
        updatedState.gasLimit = gasLimit;
      }

      const maxAmount = calculateMaxAmount(token, balance, txFeeInfo.fee, txFeeInfo.gasToken);
      const amount = formatAmount(maxAmount);

      this.setState({
        ...updatedState,
        value: { amount },
        gettingFee: false,
        calculatingMaxValue: false,
        txFeeInfo,
      }, () => this.checkFormInputErrors());
    });
  };

  getGasLimitForKeyWallet = (amount: number) => {
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

  getKeyWalletTxFee = (txSpeed?: string, gasLimit?: number): TransactionFeeInfo => {
    txSpeed = txSpeed || this.getTxSpeed();
    gasLimit = gasLimit || this.state.gasLimit || 0;

    const { gasInfo } = this.props;
    const gasPrice = gasInfo.gasPrice[txSpeed] || 0;
    const gasPriceWei = utils.parseUnits(gasPrice.toString(), 'gwei');

    return {
      fee: gasPriceWei.mul(gasLimit),
    };
  };

  updateKeyWalletGasLimitAndTxFee = async (amount: number) => {
    const gasLimit = await this.getGasLimitForKeyWallet(amount).catch(() => null);
    if (gasLimit) {
      this.setState({ gasLimit }, () => this.updateTxFee());
    }
  };

  getSmartWalletTxFee = async (amount?: number): Promise<TransactionFeeInfo> => {
    const { receiver, assetData, useGasToken } = this.props;
    const { inputHasError } = this.state;

    const value = Number(amount || get(this.state, 'value.amount', 0));
    const defaultResponse = { fee: new BigNumber(0) };

    if (inputHasError || !value) return defaultResponse;

    const transaction = { recipient: receiver, value };
    const estimated = await smartWalletService
      .estimateAccountTransaction(transaction, assetData)
      .then(data => buildTxFeeInfo(data, useGasToken))
      .catch(() => null);

    if (!estimated) { // TODO: maybe we should show a Toast?
      return defaultResponse;
    }

    return estimated;
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
    const { rates, fiatCurrency, isSmartAccount } = this.props;
    if (isSmartAccount) return null;

    return Object.keys(SPEED_TYPE_LABELS).map(txSpeed => {
      const feeInEth = formatAmount(utils.formatEther(this.getKeyWalletTxFee(txSpeed).fee));
      const feeInFiat = parseFloat(feeInEth) * getRate(rates, ETH, fiatCurrency);
      const formattedFeeInFiat = formatFiat(feeInFiat, fiatCurrency);
      return (
        <Btn
          key={txSpeed}
          primaryInverted
          onPress={this.handleTxSpeedChange(txSpeed)}
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
      txFeeInfo,
      submitPressed,
      showRelayerMigrationModal,
    } = this.state;
    const {
      session,
      balances,
      rates,
      assetData,
      fiatCurrency,
      accountAssets,
      accountHistory,
      isGasTokenSupported,
      isSmartAccount,
    } = this.props;

    const { token, iconColor, decimals } = assetData;
    const feeSymbol = get(txFeeInfo?.gasToken, 'symbol', ETH);

    // balance
    const balance = getBalance(balances, token);

    // value
    const currentValue = parseFloat(get(value, 'amount', 0));

    // fee
    let isEnoughForFee = true;
    let feeDisplayValue = '';
    if (txFeeInfo) {
      const balanceCheckTransaction = {
        txFeeInWei: txFeeInfo.fee,
        amount: currentValue,
        decimals,
        symbol: token,
        gasToken: txFeeInfo.gasToken,
      };
      isEnoughForFee = isEnoughBalanceForTransactionFee(balances, balanceCheckTransaction);
      feeDisplayValue = formatTransactionFee(txFeeInfo.fee, txFeeInfo.gasToken);
    }

    // max amount
    const maxAmount = calculateMaxAmount(token, balance, txFeeInfo?.fee, txFeeInfo?.gasToken);

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
    const showFee = !enteredMoreThanBalance && !gettingFee && !!txFeeInfo && txFeeInfo.fee.gt(0);
    const isNextButtonDisabled = gettingFee || !session.isOnline;
    const nextButtonTitle = gettingFee
      ? 'Getting the fee..'
      : 'Next';

    const showRelayerMigration = showFee && isSmartAccount && !isGasTokenSupported;
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
            {showRelayerMigration && this.renderRelayerMigrationButton()}
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
              onChange={this.handleAmountChange}
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

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
  isGasTokenSupported: isGasTokenSupportedSelector,
  isSmartAccount: isActiveAccountSmartWalletSelector,
  useGasToken: useGasTokenSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendEthereumTokens);
