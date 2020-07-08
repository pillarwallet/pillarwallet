// @flow
import * as React from 'react';
import { BackHandler, Keyboard, Platform } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { createStructuredSelector } from 'reselect';
import { COLLECTIBLES_NETWORK, NETWORK_PROVIDER } from 'react-native-dotenv';
import get from 'lodash.get';
import { BigNumber } from 'bignumber.js';
import isEqual from 'lodash.isequal';

// actions
import { fetchGasInfoAction } from 'actions/historyActions';

// components
import ReviewAndConfirm from 'components/ReviewAndConfirm';

// constants
import { SEND_COLLECTIBLE_CONTACTS, SEND_TOKEN_ASSETS, SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { ETH, SPEED_TYPES } from 'constants/assetsConstants';

// utils
import { formatTransactionFee, getEthereumProvider, noop } from 'utils/common';
import { addressesEqual, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { getAccountName } from 'utils/accounts';
import { buildTxFeeInfo } from 'utils/smartWallet';

// services
import smartWalletService from 'services/smartWallet';
import { buildERC721TransactionData, calculateGasEstimate, fetchRinkebyETHBalance } from 'services/assets';

// selectors
import { activeAccountAddressSelector } from 'selectors';
import { accountBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';
import {
  isActiveAccountSmartWalletSelector,
  useGasTokenSelector,
} from 'selectors/smartWallet';

// types
import type { CollectibleTransactionPayload, TransactionFeeInfo } from 'models/Transaction';
import type { GasInfo } from 'models/GasInfo';
import type { Accounts } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Asset, Assets, Balances } from 'models/Asset';

type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  fetchGasInfo: Function,
  gasInfo: GasInfo,
  wallet: Object,
  activeAccountAddress: string,
  accounts: Accounts,
  accountAssets: Assets,
  supportedAssets: Asset[],
  balances: Balances,
  isSmartAccount: boolean,
  useGasToken: boolean,
};

type State = {
  note: ?string,
  rinkebyETH: string,
  gettingFee: boolean,
  gasLimit: number,
  txFeeInfo: ?TransactionFeeInfo,
};


class SendCollectibleConfirm extends React.Component<Props, State> {
  assetData: Object;
  receiver: string;
  receiverEnsName: string;
  source: string;
  isRopstenNetwork: boolean;

  constructor(props) {
    super(props);
    this.assetData = this.props.navigation.getParam('assetData', {});
    this.receiver = this.props.navigation.getParam('receiver', '');
    this.source = this.props.navigation.getParam('source', '');
    this.receiverEnsName = this.props.navigation.getParam('receiverEnsName');
    this.isRopstenNetwork = NETWORK_PROVIDER === 'ropsten';

    this.state = {
      note: null,
      rinkebyETH: '',
      gasLimit: 0,
      gettingFee: true,
      txFeeInfo: null,
    };
  }

  componentDidMount() {
    const { fetchGasInfo, isSmartAccount } = this.props;
    if (Platform.OS === 'android') BackHandler.addEventListener('hardwareBackPress', this.handleBackAction);
    if (!isSmartAccount) {
      fetchGasInfo();
    }
    this.fetchETHBalanceInRinkeby();
    this.calculateTransactionFee();
  }

  componentDidUpdate(prevProps: Props) {
    const { gasInfo, session } = this.props;
    if (prevProps.session.isOnline !== session.isOnline && session.isOnline) {
      this.props.fetchGasInfo();
    }
    if (!isEqual(prevProps.gasInfo, gasInfo)) {
      this.updateTransactionFee();
    }
  }

  componentWillUnmount() {
    if (Platform.OS === 'android') BackHandler.removeEventListener('hardwareBackPress', this.handleBackAction);
  }

  getTransactionPayload = (): CollectibleTransactionPayload => {
    const { activeAccountAddress } = this.props;
    const { txFeeInfo, note } = this.state;
    const {
      name,
      tokenType,
      id: tokenId,
      contractAddress,
    } = this.assetData;

    return {
      from: activeAccountAddress,
      to: this.receiver,
      receiverEnsName: this.receiverEnsName,
      name,
      contractAddress,
      tokenType,
      tokenId,
      txFeeInWei: txFeeInfo?.fee || new BigNumber(0),
      note,
    };
  };

  updateTransactionFee = async () => {
    this.setState({ gettingFee: true }, () => {
      this.calculateTransactionFee();
    });
  };

  handleBackAction = () => {
    const { navigation } = this.props;
    const backTo = navigation.getParam('backTo');
    switch (backTo) {
      case SEND_COLLECTIBLE_CONTACTS:
        navigation.navigate(SEND_COLLECTIBLE_CONTACTS, { assetData: this.assetData });
        break;
      case SEND_TOKEN_ASSETS:
        navigation.dismiss();
        break;
      default:
        navigation.goBack();
    }
  };

  fetchETHBalanceInRinkeby = async () => {
    /**
     * we're fetching Rinkeby ETH if current network is Ropsten because
     * our used collectibles in testnets are sent only using Rinkeby
     * so if we're not on Rinkeby itself we can only check Rinkeby balance
     * using this additional call
     */
    if (!this.isRopstenNetwork) return;
    const { wallet } = this.props;
    const rinkebyETH = await fetchRinkebyETHBalance(wallet.address);
    this.setState({ rinkebyETH });
  };

  calculateTransactionFee = async () => {
    const { isSmartAccount } = this.props;
    const transactionPayload = this.getTransactionPayload();

    let gasLimit;
    if (!isSmartAccount) {
      gasLimit = await calculateGasEstimate(transactionPayload);
      this.setState({ gasLimit });
    }

    const txFeeInfo = isSmartAccount
      ? await this.getSmartWalletTxFee(transactionPayload)
      : this.getKeyWalletTxFee(transactionPayload, gasLimit);

    this.setState({ txFeeInfo, gettingFee: false });
  };

  getKeyWalletTxFee = (transaction: CollectibleTransactionPayload, gasLimit?: number): TransactionFeeInfo => {
    const { gasInfo } = this.props;
    gasLimit = gasLimit || 0;

    const gasPrice = gasInfo.gasPrice[SPEED_TYPES.NORMAL] || 0;
    const gasPriceWei = utils.parseUnits(gasPrice.toString(), 'gwei');

    return {
      fee: gasPriceWei.mul(gasLimit),
    };
  };

  getSmartWalletTxFee = async (transaction: CollectibleTransactionPayload): Promise<TransactionFeeInfo> => {
    const { useGasToken } = this.props;
    const defaultResponse = { fee: new BigNumber(0) };
    const provider = getEthereumProvider(COLLECTIBLES_NETWORK);
    const data = await buildERC721TransactionData(transaction, provider);

    const estimateTransaction = {
      data,
      recipient: transaction.contractAddress || '',
      value: 0,
    };

    const estimated = await smartWalletService
      .estimateAccountTransaction(estimateTransaction)
      .then(result => buildTxFeeInfo(result, useGasToken))
      .catch(() => null);

    if (!estimated) {
      return defaultResponse;
    }

    return estimated;
  };

  handleFormSubmit = () => {
    Keyboard.dismiss();
    const { navigation, isSmartAccount } = this.props;
    const { txFeeInfo, gasLimit } = this.state;
    if (!txFeeInfo) return;

    let transactionPayload = this.getTransactionPayload();

    if (!isSmartAccount) {
      const gasPrice = gasLimit ? txFeeInfo.fee.div(gasLimit).toNumber() : 0;
      transactionPayload = {
        ...transactionPayload,
        gasLimit,
        gasPrice,
      };
    }

    if (txFeeInfo.gasToken) transactionPayload.gasToken = txFeeInfo.gasToken;

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      source: this.source,
    });
  };

  handleNoteChange = (text) => {
    this.setState({ note: text });
  };

  render() {
    const {
      session,
      accounts,
      balances,
    } = this.props;
    const {
      rinkebyETH,
      gettingFee,
      note,
      txFeeInfo,
    } = this.state;
    const { name } = this.assetData;

    // recipient
    const to = this.receiver;
    const userAccount = accounts.find(({ id }) => addressesEqual(id, to));

    let isEnoughForFee = true;
    let feeDisplayValue = '';
    if (txFeeInfo) {
      // rinkeby testnet fee check
      const txFee = utils.formatEther(txFeeInfo.fee.toString());
      const canProceedTesting = this.isRopstenNetwork && parseFloat(rinkebyETH) > parseFloat(txFee);

      // fee
      const balanceCheckTransaction = {
        txFeeInWei: txFeeInfo.fee,
        amount: 0,
        gasToken: txFeeInfo.gasToken,
      };
      isEnoughForFee = canProceedTesting || isEnoughBalanceForTransactionFee(balances, balanceCheckTransaction);
      feeDisplayValue = formatTransactionFee(txFeeInfo.fee, txFeeInfo.gasToken);
    }

    const feeSymbol = get(txFeeInfo?.gasToken, 'symbol', ETH);
    const errorMessage = !isEnoughForFee ? `Not enough ${feeSymbol} for transaction fee` : '';

    // confirm button
    const isConfirmDisabled = gettingFee || !session.isOnline || !txFeeInfo || !isEnoughForFee;
    const confirmButtonTitle = gettingFee
      ? 'Getting the fee..'
      : 'Confirm Transaction';

    const reviewData = [
      {
        label: 'Collectible',
        value: name,
      },
    ];

    if (this.receiverEnsName) {
      reviewData.push({
        label: 'Recipient ENS name',
        value: this.receiverEnsName,
      });
    }

    if (userAccount) {
      reviewData.push({
        label: 'Recipient',
        value: getAccountName(userAccount.type),
      });
    }

    reviewData.push(
      {
        label: 'Recipient Address',
        value: to,
      },
      {
        label: 'Est. Network Fee',
        value: feeDisplayValue,
        isLoading: gettingFee,
      },
    );

    if (this.isRopstenNetwork) {
      reviewData.push({
        label: 'Balance in Rinkeby ETH (visible in dev and staging while on Ropsten)',
        value: `${rinkebyETH} ETH`,
      });
    }

    return (
      <ReviewAndConfirm
        reviewData={reviewData}
        isConfirmDisabled={isConfirmDisabled}
        onConfirm={this.handleFormSubmit}
        submitButtonTitle={confirmButtonTitle}
        contentContainerStyle={{ marginTop: 40 }}
        customOnBack={this.handleBackAction}
        errorMessage={errorMessage}
        onTextChange={session.isOnline ? this.handleNoteChange : noop}
        textInputValue={note}
      />
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  history: { gasInfo },
  wallet: { data: wallet },
  accounts: { data: accounts },
  assets: { supportedAssets },
}: RootReducerState): $Shape<Props> => ({
  session,
  gasInfo,
  wallet,
  accounts,
  supportedAssets,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  activeAccountAddress: activeAccountAddressSelector,
  accountAssets: accountAssetsSelector,
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

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendCollectibleConfirm);
