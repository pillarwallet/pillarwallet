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
import { COLLECTIBLES_NETWORK } from 'react-native-dotenv';
import t from 'translations/translate';

// components
import Button from 'components/Button';
import { TextLink, Label, BaseText } from 'components/Typography';
import SlideModal from 'components/Modals/SlideModal';
import Spinner from 'components/Spinner';
import RelayerMigrationModal from 'components/RelayerMigrationModal';
import FeeLabelToggle from 'components/FeeLabelToggle';
import { Spacing } from 'components/Layout';
import SendContainer from 'containers/SendContainer';
import Toast from 'components/Toast';

// utils
import { formatAmount, formatFiat, getEthereumProvider, isValidNumber } from 'utils/common';
import { fontStyles, spacing } from 'utils/variables';
import { getBalance, getRate, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { buildTxFeeInfo } from 'utils/smartWallet';
import { getContactsEnsName } from 'utils/contacts';

// services
import { buildERC721TransactionData, calculateGasEstimate } from 'services/assets';
import smartWalletService from 'services/smartWallet';

// selectors
import {
  isActiveAccountSmartWalletSelector,
  isGasTokenSupportedSelector,
  useGasTokenSelector,
} from 'selectors/smartWallet';
import { activeAccountAddressSelector } from 'selectors';
import { inactiveUserWalletForSendSelector } from 'selectors/wallets';
import { visibleActiveAccountAssetsWithBalanceSelector } from 'selectors/assets';
import { activeAccountMappedCollectiblesSelector } from 'selectors/collectibles';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { GasInfo } from 'models/GasInfo';
import type { TokenTransactionPayload, Transaction, TransactionFeeInfo } from 'models/Transaction';
import type { Balances, Rates, AssetData, Assets } from 'models/Asset';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { SessionData } from 'models/Session';
import type { Option } from 'models/Selector';

// constants
import { SEND_COLLECTIBLE_CONFIRM, SEND_TOKEN_CONFIRM } from 'constants/navigationConstants';
import { ETH, SPEED_TYPES, SPEED_TYPE_LABELS, COLLECTIBLES } from 'constants/assetsConstants';

// actions
import { fetchGasInfoAction } from 'actions/historyActions';


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
  inactiveUserAccounts: Option[],
  assetsWithBalance: Option[],
  collectibles: Option[],
  baseFiatCurrency: ?string,
};

type State = {
  amount: ?string,
  assetData: ?AssetData,
  showTransactionSpeedModal: boolean,
  gasLimit: number,
  gettingFee: boolean,
  inputHasError: boolean,
  txFeeInfo: ?TransactionFeeInfo,
  submitPressed: boolean,
  showRelayerMigrationModal: boolean,
  receiver?: string,
  receiverEnsName?: string,
  selectedContact: ?Option,
};

type FooterProps = {
  showTransactionSpeeds: boolean,
  showRelayerMigration: boolean,
  showFee: boolean,
  isLoading: boolean,
  feeError: boolean,
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
      navigation,
      session,
      useGasToken,
      gasInfo,
      isSmartAccount,
      isGasTokenSupported,
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
      if (navigation.getParam('assetData')) {
        this.setPreselectedValues();
      } else {
        this.handleAmountChange();
      }
    }
  }

  setPreselectedValues = () => {
    const { navigation, assetsWithBalance, collectibles } = this.props;
    const assetData = navigation.getParam('assetData');
    const contact = navigation.getParam('contact');
    if (assetData) {
      let formattedSelectedAsset;
      if (assetData.tokenType === COLLECTIBLES) {
        formattedSelectedAsset = collectibles.find(({ tokenId }) => assetData.id === tokenId);
      } else {
        formattedSelectedAsset = assetsWithBalance.find(({ token }) => assetData.token === token);
      }
      if (formattedSelectedAsset) this.handleAmountChange({ selector: formattedSelectedAsset, input: '' });
    }
    if (contact) {
      const { userName, ethAddress } = contact;
      const receiver = {
        name: userName || ethAddress,
        ethAddress,
        value: ethAddress,
      };
      this.setReceiver(receiver);
    }
  };


  // form methods

  setReceiver = async (value: Option, onSuccess?: () => void) => {
    this.setState({ gettingFee: true });
    const { receiverEnsName, receiver } = await getContactsEnsName(value?.ethAddress);
    if (receiver) {
      this.setState({ selectedContact: value, receiver, receiverEnsName }, () => {
        this.updateTxFee();
        if (onSuccess) onSuccess();
      });
    }
  };

  handleReceiverSelect = (value: Option, onSuccess?: () => void) => {
    if (!value?.ethAddress) {
      this.setState({ selectedContact: null, receiver: '', receiverEnsName: '' }, () => {
        if (onSuccess) onSuccess();
        this.updateTxFee();
      });
    } else {
      this.setReceiver(value, onSuccess);
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

      const amount = parseFloat(get(value, 'input') || 0);
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
    this.setState({ gettingFee: true });

    const txFeeInfo = isSmartAccount
      ? await this.getSmartWalletTxFee()
      : this.getKeyWalletTxFee();

    this.setState({ txFeeInfo, gettingFee: false });
  };

  getGasLimitForKeyWallet = (amount: number) => {
    const { assetData, receiver } = this.state;
    if (!assetData) return Promise.resolve(0);

    const {
      token: symbol,
      contractAddress,
      decimals,
      tokenType,
    } = assetData;

    // cannot be set if value is zero or not present (if sending token), fee select will be hidden
    if (tokenType !== COLLECTIBLES && !amount) return Promise.resolve(0);
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
    const { useGasToken, activeAccountAddress } = this.props;
    const {
      inputHasError,
      assetData,
      receiver,
      receiverEnsName,
    } = this.state;

    const value = Number(amount || get(this.state, 'amount', 0));
    const defaultResponse = { fee: new BigNumber(0) };
    const isCollectible = get(assetData, 'tokenType') === COLLECTIBLES;

    if (inputHasError || !assetData || !receiver) return defaultResponse;

    let data;
    if (isCollectible) {
      const provider = getEthereumProvider(COLLECTIBLES_NETWORK);
      const {
        name,
        id,
        contractAddress,
        tokenType,
      } = assetData;
      const collectibleTransaction = {
        from: activeAccountAddress,
        to: receiver,
        receiverEnsName,
        name,
        tokenId: id,
        contractAddress,
        tokenType,
      };
      data = await buildERC721TransactionData(collectibleTransaction, provider);
    }

    const transaction = { recipient: receiver, value, data };
    const estimated = await smartWalletService
      .estimateAccountTransaction(transaction, assetData)
      .then(res => buildTxFeeInfo(res, useGasToken))
      .catch(() => null);


    if (!estimated) {
      Toast.show({
        message: t('toast.transactionFeeEstimationFailed'),
        emoji: 'woman_shrugging',
        supportLink: true,
        type: 'warning',
      });
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

    if (assetData.tokenType === COLLECTIBLES) {
      this.setState({ submitPressed: false }, () => {
        navigation.navigate(SEND_COLLECTIBLE_CONFIRM, {
          assetData,
          receiver,
          source,
          receiverEnsName,
        });
      });
      return;
    }

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

  renderFeeToggle = (showFee: boolean, feeError: boolean) => {
    const { txFeeInfo } = this.state;
    if (showFee && txFeeInfo) {
      const { fee, gasToken } = txFeeInfo;
      const gasTokenSymbol = get(gasToken, 'symbol', ETH);
      return (
        <>
          <FeeLabelToggle txFeeInWei={fee} gasToken={gasToken} />
          {!!feeError &&
            <BaseText center secondary>
              Sorry, you do not have enough {gasTokenSymbol} in your wallet to make this transaction.
              Please top up your wallet and try again.
            </BaseText>
          }
        </>
      );
    }
    return null;
  };

  renderFee = (props: FooterProps) => {
    const {
      showTransactionSpeeds,
      showRelayerMigration,
      showFee,
      isLoading,
      feeError,
    } = props;

    if (isLoading) {
      return <Spinner width={20} height={20} />;
    }

    if (showTransactionSpeeds) {
      return (
        <TouchableOpacity onPress={() => this.setState({ showTransactionSpeedModal: true })}>
          <SendTokenDetailsValue>
            <BaseText center secondary>Fee: {this.getTransactionFeeString()}</BaseText>
          </SendTokenDetailsValue>
          {!!feeError &&
            <BaseText center secondary>
              Sorry, you do not have enough ETH in your wallet to make this transaction.
              Please top up your wallet and try again.
            </BaseText>
          }
        </TouchableOpacity>
      );
    } else if (showRelayerMigration) {
      return (
        <>
          {this.renderFeeToggle(showFee, feeError)}
          <Spacing h={spacing.medium} />
          {this.renderRelayerMigrationButton()}
        </>);
    }
    return this.renderFeeToggle(showFee, feeError);
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
      inactiveUserAccounts,
      session,
    } = this.props;

    const token = get(assetData, 'token');
    const preselectedCollectible = get(assetData, 'tokenType') === COLLECTIBLES ? get(assetData, 'id') : '';

    // value
    const currentValue = parseFloat(amount || 0);

    // balance
    const balance = getBalance(balances, token);

    const enteredMoreThanBalance = currentValue > balance;
    const hasAllFeeData = !gettingFee && !!txFeeInfo && txFeeInfo.fee.gt(0) && !!receiver;
    const isValidAmount = !!amount && isValidNumber(currentValue);

    const showFeeForAsset = !enteredMoreThanBalance && hasAllFeeData && isValidAmount;
    const showFeeForCollectible = hasAllFeeData;
    const isCollectible = get(assetData, 'tokenType') === COLLECTIBLES;
    const showFee = isCollectible ? showFeeForCollectible : showFeeForAsset;

    const showRelayerMigration = showFee && isSmartAccount && !isGasTokenSupported;
    const showTransactionSpeeds = !inputHasError && !!gasLimit && !isSmartAccount && !showRelayerMigration;

    const hasAllData = isCollectible ? (!!receiver && !!assetData) : (!inputHasError && !!receiver && !!currentValue);

    let feeError = false;
    if (txFeeInfo && assetData && isValidAmount) {
      feeError = !isEnoughBalanceForTransactionFee(balances, {
        txFeeInWei: txFeeInfo.fee,
        gasToken: txFeeInfo.gasToken,
        decimals: assetData.decimals,
        amount,
        symbol: token,
      });
    }

    const showNextButton = !gettingFee && hasAllData && !feeError;

    const isNextButtonDisabled = !session.isOnline;

    return (
      <SendContainer
        customSelectorProps={{
          onOptionSelect: this.handleReceiverSelect,
          options: [],
          selectedOption: selectedContact,
          horizontalOptionsData: [{ data: [...inactiveUserAccounts] }],
        }}
        customValueSelectorProps={{
          getFormValue: this.handleAmountChange,
          getError: this.manageFormErrorState,
          txFeeInfo,
          preselectedAsset: token,
          preselectedCollectible,
          showAllAssetTypes: true,
        }}
        footerProps={{
          isNextButtonVisible: showNextButton,
          buttonProps: {
            onPress: this.handleFormSubmit,
            isLoading: submitPressed,
            disabled: isNextButtonDisabled,
          },
          footerTopAddon: !!receiver && this.renderFee({
            showTransactionSpeeds,
            showRelayerMigration,
            showFee,
            isLoading: gettingFee && !inputHasError,
            feeError,
          }),
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
  inactiveUserAccounts: inactiveUserWalletForSendSelector,
  assetsWithBalance: visibleActiveAccountAssetsWithBalanceSelector,
  collectibles: activeAccountMappedCollectiblesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendEthereumTokens);
