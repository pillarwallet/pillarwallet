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
import { utils } from 'ethers';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import debounce from 'lodash.debounce';
import get from 'lodash.get';
import isEqual from 'lodash.isequal';
import { createStructuredSelector } from 'reselect';

// components
import Button from 'components/Button';
import { TextLink, Label, BaseText } from 'components/Typography';
import SlideModal from 'components/Modals/SlideModal';
import Spinner from 'components/Spinner';
import RelayerMigrationModal from 'components/RelayerMigrationModal';
import FeeLabelToggle from 'components/FeeLabelToggle';
import { Spacing } from 'components/Layout';

// utils
import { formatAmount, formatFiat, resolveEnsName } from 'utils/common';
import { fontStyles, spacing } from 'utils/variables';
import { getBalance, getRate } from 'utils/assets';
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
import { contactsForSendFlowSelector } from 'selectors/contacts';
import { innactiveUserWalletForSendSellector } from 'selectors/wallets';
import { visibleActiveAccountAssetsWithBalanceSelector } from 'selectors/assets';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { GasInfo } from 'models/GasInfo';
import type { TokenTransactionPayload, Transaction, TransactionFeeInfo } from 'models/Transaction';
import type { Balances, Rates, AssetData, Assets } from 'models/Asset';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { SessionData } from 'models/Session';
import type { Option } from 'models/Selector';

// constants
import { SEND_TOKEN_CONFIRM } from 'constants/navigationConstants';
import { ETH, SPEED_TYPES, SPEED_TYPE_LABELS } from 'constants/assetsConstants';

// actions
import { fetchGasInfoAction } from 'actions/historyActions';


import { isEnsName } from 'utils/validators';
import { getAccountName } from 'utils/accounts';
import SendContainer from 'containers/SendContainer';


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


type Props = {
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
  onUpdateTransactionSpeed: (speed: string) => void,
  accountAssets: Assets,
  accountHistory: Transaction[],
  isGasTokenSupported: boolean,
  isSmartAccount: boolean,
  useGasToken: boolean,
  contacts: Option[],
  inactiveUserAccounts: Option[],
  assetsWithBalance: Assets,
  baseFiatCurrency: ?string,
};

type State = {
  amount: ?string,
  assetData: ?AssetData,
  receiverEnsName: string,
  showTransactionSpeedModal: boolean,
  gasLimit: number,
  gettingFee: boolean,
  inputHasError: boolean,
  txFeeInfo: ?TransactionFeeInfo,
  submitPressed: boolean,
  showRelayerMigrationModal: boolean,
  receiver?: string,
  receiverEnsName?: string,
  selectedContact?: Object, // todo: add proper type
};

type FooterProps = {
  showTransactionSpeeds: boolean,
  showRelayerMigration: boolean,
  showFee: boolean,
  isLoading: boolean,
};

class SendEthereumTokens extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.updateTxFee = debounce(this.updateTxFee, 500);
    this.updateKeyWalletGasLimitAndTxFee = debounce(this.updateKeyWalletGasLimitAndTxFee, 500);
    this.state = {
      amount: null,
      showTransactionSpeedModal: false,
      gasLimit: 0,
      gettingFee: true,
      inputHasError: false,
      txFeeInfo: null,
      submitPressed: false,
      showRelayerMigrationModal: false,
      selectedContact: null,
      receiver: '',
      receiverEnsName: '',
      assetData: null,
    };
  }

  componentDidMount() {
    this.setPreselectedValues();
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
    if (this.state.amount === null) return;

    // if gas token was updated after switching to gas token relayer or gasInfo updated
    if (prevProps.useGasToken !== useGasToken || !isEqual(prevProps.gasInfo, gasInfo)) {
      this.handleAmountChange();
    }
  }

  setPreselectedValues = () => {
    const {
      navigation,
      assetsWithBalance,
      contacts,
      inactiveUserAccounts,
    } = this.props;
    const assetData = navigation.getParam('assetData');
    const contact = navigation.getParam('contact');
    if (assetData) {
      const formattedSelectedAsset = assetsWithBalance[assetData.token];
      if (formattedSelectedAsset) this.handleAmountChange({ selector: formattedSelectedAsset, input: '' });
    }
    if (contact) {
      const formattedContact = [...contacts, ...inactiveUserAccounts]
        .find(({ name }) => name === contact.username || name === getAccountName(contact.type));
      if (formattedContact) this.setReceiver(formattedContact);
    }
  };


  // form methods

  getEnsName = async (address: ?string) => {
    if (!address) return {};
    let receiverEnsName = '';
    let receiver = address;

    if (isEnsName(address)) {
      const resolvedAddress = await resolveEnsName(address);
      if (!resolvedAddress) {
        // this.setInvalidEns(); // todo: handle ens validation
        return {};
      }
      receiverEnsName = address;
      receiver = resolvedAddress;
    }

    return { receiverEnsName, receiver };
  };


  setReceiver = async (value) => {
    const { receiverEnsName, receiver } = await this.getEnsName(value?.ethAddress);
    if (!receiver) {
      // todo: handle error!
      this.setState({ selectedContact: {}, receiver: '', receiverEnsName: '' });
    } else {
      this.setState({ selectedContact: value, receiver, receiverEnsName }, () => {
        if (receiver) this.updateTxFee();
      });
    }
  };

  handleReceiverSelect = (value) => {
    if (!value?.ethAddress) {
      this.setState({ selectedContact: null, receiver: '', receiverEnsName: '' }, () => {
        this.updateTxFee();
      });
    } else {
      this.setReceiver(value);
    }
  };

  handleAmountChange = (value: ?Object) => {
    const { isSmartAccount } = this.props;
    this.setState({
      gettingFee: true,
      amount: value?.input || '0',
      assetData: value?.selector,
    }, () => {
      if (isSmartAccount) {
        this.updateTxFee();
        return;
      }

      const amount = parseFloat(get(value, 'input', 0));
      this.updateKeyWalletGasLimitAndTxFee(amount);
    });
  };

  manageFormErrorState = (errorMessage: ?string) => {
    const { inputHasError } = this.state;
    const newErrorState = !!errorMessage;
    if (inputHasError !== newErrorState) this.setState({ inputHasError: newErrorState });
  };


  // transaction estimation methods

  getTxSpeed = () => {
    return this.props.transactionSpeed || SPEED_TYPES.NORMAL;
  };

  handleTxSpeedChange = (txSpeed: string) => () => {
    this.props.onUpdateTransactionSpeed(txSpeed);
    this.setState({ showTransactionSpeedModal: false });
  };

  updateTxFee = async () => {
    const { isSmartAccount } = this.props;

    const txFeeInfo = isSmartAccount
      ? await this.getSmartWalletTxFee()
      : this.getKeyWalletTxFee();

    this.setState({ txFeeInfo, gettingFee: false });
  };

  getGasLimitForKeyWallet = (amount: number) => {
    const { assetData, receiver } = this.state;
    // cannot be set if value is zero or not present, fee select will be hidden
    if (!amount || !assetData) return Promise.resolve(0);

    const { token: symbol, contractAddress, decimals } = assetData;
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
    const { useGasToken } = this.props;
    const { inputHasError, assetData, receiver } = this.state;

    const value = Number(amount || get(this.state, 'amount', 0));
    const defaultResponse = { fee: new BigNumber(0) };

    if (inputHasError || !value || !assetData || !receiver) return defaultResponse;

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


  // form submit

  handleFormSubmit = async () => {
    const {
      submitPressed,
      txFeeInfo,
      gasLimit,
      amount,
      assetData,
      receiver,
      receiverEnsName,
    } = this.state;
    if (submitPressed || !txFeeInfo || !amount || !receiver || !assetData) return;

    this.setState({ submitPressed: true });

    const { source, navigation, isSmartAccount } = this.props;

    // $FlowFixMe
    let transactionPayload: TokenTransactionPayload = {
      to: receiver,
      receiverEnsName,
      amount,
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


  // render methods

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

  getTransactionFeeString = () => {
    const { rates, fiatCurrency } = this.props;
    const txSpeed = this.getTxSpeed();
    const feeInEth = formatAmount(utils.formatEther(this.getKeyWalletTxFee(txSpeed).fee));
    const feeInFiat = parseFloat(feeInEth) * getRate(rates, ETH, fiatCurrency);
    const formattedFeeInFiat = formatFiat(feeInFiat, fiatCurrency);

    return `${feeInEth} ETH (${formattedFeeInFiat})`;
  };

  renderFeeToggle = (showFee: boolean) => {
    const { txFeeInfo } = this.state;
    if (showFee && txFeeInfo) {
      const { fee, gasToken } = txFeeInfo;
      return <FeeLabelToggle txFeeInWei={fee} gasToken={gasToken} />;
    }
    return null;
  };

  renderFee = (props: FooterProps) => {
    const {
      showTransactionSpeeds,
      showRelayerMigration,
      showFee,
      isLoading,
    } = props;

    if (isLoading) {
      return <Spinner width={20} height={20} />;
    }

    if (showTransactionSpeeds) {
      return (
        <TouchableOpacity onPress={() => this.setState({ showTransactionSpeedModal: true })}>
          <SendTokenDetailsValue>
            <BaseText secondary>Fee: {this.getTransactionFeeString()}</BaseText>
          </SendTokenDetailsValue>
        </TouchableOpacity>
      );
    } else if (showRelayerMigration) {
      return (
        <>
          {this.renderFeeToggle(showFee)}
          <Spacing h={spacing.medium} />
          {this.renderRelayerMigrationButton()}
        </>);
    }
    return this.renderFeeToggle(showFee);
  };

  render() {
    const {
      amount,
      showTransactionSpeedModal,
      gasLimit,
      gettingFee,
      inputHasError,
      txFeeInfo,
      showRelayerMigrationModal,
      assetData,
      selectedContact,
      submitPressed,
      receiver,
    } = this.state;
    const {
      balances,
      accountAssets,
      accountHistory,
      isGasTokenSupported,
      isSmartAccount,
      contacts,
      inactiveUserAccounts,
      session,
    } = this.props;

    const token = get(assetData, 'token');

    // value
    const currentValue = parseFloat(amount || 0);

    // balance
    const balance = getBalance(balances, token);

    const enteredMoreThanBalance = currentValue > balance;
    const showFee = !enteredMoreThanBalance && !gettingFee && !!txFeeInfo && txFeeInfo.fee.gt(0);
    const showRelayerMigration = showFee && isSmartAccount && !isGasTokenSupported;
    const showTransactionSpeeds = !inputHasError && !!gasLimit && !isSmartAccount && !showRelayerMigration;

    const showNextButton = !!amount && !!parseFloat(amount) && !!receiver && !inputHasError && !gettingFee;
    const isNextButtonDisabled = gettingFee || !session.isOnline;

    return (
      <SendContainer
        customSelectorProps={{
          onOptionSelect: this.handleReceiverSelect,
          options: contacts,
          selectedOption: selectedContact,
          horizontalOptionsData: [{ data: [...inactiveUserAccounts] }]
        }}
        customValueSelectorProps={{
          getFormValue: this.handleAmountChange,
          getError: this.manageFormErrorState,
          txFeeInfo,
          preselectedAsset: token,
        }}
        footerProps={{
          disableNext: isNextButtonDisabled,
          isNextButtonVisible: showNextButton,
          buttonProps: {
            onPress: this.handleFormSubmit,
            isLoading: submitPressed,
          },
          footerTopAddon: this.renderFee({
            showTransactionSpeeds,
            showRelayerMigration,
            showFee,
            isLoading: gettingFee && !!amount && !!parseFloat(amount) && !inputHasError,
          })
        }}
      >
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
      </SendContainer>
    );
  }
}

const mapStateToProps = ({
  history: { gasInfo },
  appSettings: { data: { baseFiatCurrency, transactionSpeed } },
}: RootReducerState): $Shape<Props> => ({
  gasInfo,
  baseFiatCurrency,
  transactionSpeed,
});

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
  isGasTokenSupported: isGasTokenSupportedSelector,
  isSmartAccount: isActiveAccountSmartWalletSelector,
  useGasToken: useGasTokenSelector,
  contacts: contactsForSendFlowSelector,
  inactiveUserAccounts: innactiveUserWalletForSendSellector,
  assetsWithBalance: visibleActiveAccountAssetsWithBalanceSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendEthereumTokens);
