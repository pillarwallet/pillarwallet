// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { BackHandler, Keyboard, Platform } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { createStructuredSelector } from 'reselect';
import { COLLECTIBLES_NETWORK, GAS_TOKEN_ADDRESS, NETWORK_PROVIDER } from 'react-native-dotenv';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import { BigNumber } from 'bignumber.js';

// actions
import { fetchGasInfoAction } from 'actions/historyActions';

// components
import { ScrollWrapper } from 'components/Layout';
import { BaseText, Label, MediumText } from 'components/Typography';
import Button from 'components/Button';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import TextInput from 'components/TextInput';
import Spinner from 'components/Spinner';

// constants
import { SEND_COLLECTIBLE_CONTACTS, SEND_TOKEN_ASSETS, SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { ETH, SPEED_TYPES } from 'constants/assetsConstants';

// utils
import { fontSizes, spacing } from 'utils/variables';
import { findMatchingContact, getUserName } from 'utils/contacts';
import { addressesEqual, getAssetDataByAddress, getAssetsAsList, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { checkIfSmartWalletAccount, getAccountName } from 'utils/accounts';
import { formatTransactionFee, getEthereumProvider } from 'utils/common';

// services
import smartWalletService from 'services/smartWallet';
import { buildERC721TransactionData, calculateGasEstimate, fetchRinkebyETHBalance } from 'services/assets';

// selectors
import { activeAccountAddressSelector, activeAccountSelector } from 'selectors';
import { accountBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';

// types
import type { CollectibleTransactionPayload, GasToken } from 'models/Transaction';
import type { GasInfo } from 'models/GasInfo';
import type { Account, Accounts } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Asset, Assets, Balances } from 'models/Asset';
import type { ContactSmartAddressData } from 'models/Contacts';


type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  contacts: Object[],
  fetchGasInfo: Function,
  gasInfo: GasInfo,
  wallet: Object,
  activeAccountAddress: string,
  accounts: Accounts,
  activeAccount: ?Account,
  accountAssets: Assets,
  supportedAssets: Asset[],
  smartWalletAccountSupportsGasToken: boolean,
  balances: Balances,
  contactsSmartAddresses: ContactSmartAddressData[],
};

type State = {
  note: ?string,
  rinkebyETH: string,
  gettingFee: boolean,
  gasLimit: number,
  feeByGasToken: boolean,
  txFeeInWei: BigNumber,
};

const FooterWrapper = styled.View`
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px;
  width: 100%;
`;

const LabeledRow = styled.View`
  margin: 10px 0;
`;

const Value = styled(MediumText)`
  font-size: ${fontSizes.big}px;
`;

class SendCollectibleConfirm extends React.Component<Props, State> {
  assetData: Object;
  receiver: string;
  receiverEnsName: string;
  source: string;
  gasToken: ?GasToken;

  constructor(props) {
    super(props);
    this.assetData = this.props.navigation.getParam('assetData', {});
    this.receiver = this.props.navigation.getParam('receiver', '');
    this.source = this.props.navigation.getParam('source', '');
    this.receiverEnsName = this.props.navigation.getParam('receiverEnsName');
    let feeByGasToken = false;

    const {
      activeAccount,
      accountAssets,
      supportedAssets,
      smartWalletAccountSupportsGasToken,
    } = props;
    const gasTokenData = getAssetDataByAddress(getAssetsAsList(accountAssets), supportedAssets, GAS_TOKEN_ADDRESS);
    const isSmartAccount = activeAccount && checkIfSmartWalletAccount(activeAccount);
    if (isSmartAccount
      && smartWalletAccountSupportsGasToken
      && !isEmpty(gasTokenData)) {
      const { decimals, address, symbol } = gasTokenData;
      this.gasToken = { decimals, address, symbol };
      feeByGasToken = true;
    }

    this.state = {
      note: null,
      rinkebyETH: '',
      gasLimit: 0,
      gettingFee: true,
      feeByGasToken,
      txFeeInWei: new BigNumber(0),
    };
  }

  componentDidMount() {
    const { fetchGasInfo } = this.props;
    if (Platform.OS === 'android') BackHandler.addEventListener('hardwareBackPress', this.handleBackAction);
    fetchGasInfo();
    this.fetchETHBalanceInRinkeby();
    this.calculateTransactionFee();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.session.isOnline !== this.props.session.isOnline && this.props.session.isOnline) {
      this.props.fetchGasInfo();
    }
  }

  componentWillUnmount() {
    if (Platform.OS === 'android') BackHandler.removeEventListener('hardwareBackPress', this.handleBackAction);
  }

  getTransactionPayload = (): CollectibleTransactionPayload => {
    const { activeAccountAddress } = this.props;
    const { txFeeInWei, note } = this.state;
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
      txFeeInWei,
      note,
    };
  };

  calculateTransactionFee = async () => {
    const { activeAccount, gasInfo } = this.props;
    let { gasLimit } = this.state;
    const transactionPayload = this.getTransactionPayload();
    let txFeeInWei;

    if (activeAccount && checkIfSmartWalletAccount(activeAccount)) {
      txFeeInWei = await this.getSmartWalletTxFeeInWei(transactionPayload);
    } else {
      const gasPrice = gasInfo.gasPrice[SPEED_TYPES.NORMAL] || 0;
      const gasPriceWei = utils.parseUnits(gasPrice.toString(), 'gwei');
      gasLimit = await calculateGasEstimate(transactionPayload);
      txFeeInWei = gasPriceWei.mul(gasLimit);
    }

    this.setState({
      gettingFee: false,
      txFeeInWei,
      gasLimit,
    });
  };

  handleBackAction = () => {
    const { navigation, contacts } = this.props;
    const backTo = navigation.getParam('backTo');
    switch (backTo) {
      case SEND_COLLECTIBLE_CONTACTS:
        navigation.navigate(SEND_COLLECTIBLE_CONTACTS, { assetData: this.assetData });
        break;
      case SEND_TOKEN_ASSETS:
        const contact = contacts.find(({ ethAddress }) => addressesEqual(this.receiver, ethAddress));
        if (!contact) {
          // this is impossible, but rather dismiss whole flow than follow faulty
          navigation.dismiss();
          break;
        }
        navigation.navigate(SEND_TOKEN_ASSETS, { contact });
        break;
      default:
        navigation.goBack();
    }
  };

  fetchETHBalanceInRinkeby = async () => {
    const { wallet } = this.props;
    const rinkebyETHBlanace = await fetchRinkebyETHBalance(wallet.address);
    this.setState({ rinkebyETH: rinkebyETHBlanace });
  };

  getSmartWalletTxFeeInWei = async (transaction: CollectibleTransactionPayload): BigNumber => {
    const { feeByGasToken } = this.state;
    const { gasInfo } = this.props;

    const provider = getEthereumProvider(COLLECTIBLES_NETWORK);
    const data = await buildERC721TransactionData(transaction, provider);

    const estimateTransaction = {
      data,
      recipient: transaction.contractAddress || '',
      gasToken: this.gasToken,
      value: 0,
    };

    const { gasTokenCost, cost: ethCost } = await smartWalletService
      .estimateAccountTransaction(estimateTransaction, gasInfo)
      .catch(() => ({}));

    if (gasTokenCost && gasTokenCost.gt(0)) {
      if (!feeByGasToken) this.setState({ feeByGasToken: true });

      return gasTokenCost;
    }

    if (feeByGasToken) this.setState({ feeByGasToken: false });

    return ethCost || new BigNumber(0);
  };

  handleFormSubmit = () => {
    Keyboard.dismiss();
    const { navigation, activeAccount } = this.props;
    const { txFeeInWei, gasLimit, feeByGasToken } = this.state;

    let transactionPayload = this.getTransactionPayload();

    if (!activeAccount || !checkIfSmartWalletAccount(activeAccount)) {
      const gasPrice = gasLimit ? txFeeInWei.div(gasLimit).toNumber() : 0;
      transactionPayload = {
        ...transactionPayload,
        gasLimit,
        gasPrice,
      };
    }

    if (feeByGasToken) {
      transactionPayload = { ...transactionPayload, gasToken: this.gasToken };
    }

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      source: this.source,
    });
  };

  handleNoteChange(text) {
    this.setState({ note: text });
  }

  render() {
    const {
      contacts,
      session,
      gasInfo,
      accounts,
      contactsSmartAddresses,
      balances,
    } = this.props;
    const {
      rinkebyETH,
      gettingFee,
      txFeeInWei,
      feeByGasToken,
    } = this.state;
    const { name } = this.assetData;

    // recipient
    const to = this.receiver;
    const contact = findMatchingContact(to, contacts, contactsSmartAddresses);
    const recipientUsername = getUserName(contact);
    const userAccount = !recipientUsername ? accounts.find(({ id }) => addressesEqual(id, to)) : null;

    // rinkeby testnet fee check
    const txFee = utils.formatEther(txFeeInWei.toString());
    const canProceedTesting = parseFloat(rinkebyETH) > parseFloat(txFee);

    // fee
    const parsedGasToken = feeByGasToken && !isEmpty(this.gasToken) ? this.gasToken : null;
    const balanceCheckTransaction = {
      txFeeInWei,
      amount: 0,
      gasToken: parsedGasToken,
    };
    const isEnoughForFee = canProceedTesting || isEnoughBalanceForTransactionFee(balances, balanceCheckTransaction);
    const feeDisplayValue = formatTransactionFee(txFeeInWei, parsedGasToken);
    const feeSymbol = get(parsedGasToken, 'symbol', ETH);
    const errorMessage = !isEnoughForFee && `Not enough ${feeSymbol} for transaction fee`;

    // confirm button
    const isConfirmDisabled = gettingFee || !session.isOnline || !gasInfo.isFetched || !isEnoughForFee;
    const confirmButtonTitle = gettingFee
      ? 'Getting the fee..'
      : 'Confirm Transaction';

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Review and confirm' }],
          customOnBack: this.handleBackAction,
        }}
        footer={(
          <FooterWrapper>
            {!!errorMessage &&
            <BaseText negative regular center style={{ marginBottom: 15 }}>
              {errorMessage}
            </BaseText>
            }
            <Button
              disabled={isConfirmDisabled}
              onPress={this.handleFormSubmit}
              title={confirmButtonTitle}
            />
          </FooterWrapper>
        )}
      >
        <ScrollWrapper
          regularPadding
          disableAutomaticScroll
        >
          <LabeledRow>
            <Label>Collectible</Label>
            <Value>{name}</Value>
          </LabeledRow>
          {!!recipientUsername &&
          <LabeledRow>
            <Label>Recipient Username</Label>
            <Value>{recipientUsername}</Value>
          </LabeledRow>
          }
          {!!this.receiverEnsName &&
          <LabeledRow>
            <Label>Recipient ENS name</Label>
            <Value>{this.receiverEnsName}</Value>
          </LabeledRow>
          }
          {!!userAccount &&
          <LabeledRow>
            <Label>Recipient</Label>
            <Value>{getAccountName(userAccount.type)}</Value>
          </LabeledRow>
          }
          <LabeledRow>
            <Label>Recipient Address</Label>
            <Value>{to}</Value>
          </LabeledRow>
          <LabeledRow>
            <Label>Est. Network Fee</Label>
            {!gettingFee && <Value>{feeDisplayValue}</Value>}
            {gettingFee && <Spinner style={{ marginTop: 5 }} width={20} height={20} />}
          </LabeledRow>
          {NETWORK_PROVIDER === 'ropsten' &&
          <LabeledRow>
            <Label>Balance in Rinkeby ETH (visible in dev and staging)</Label>
            <Value>{rinkebyETH} ETH</Value>
          </LabeledRow>}
          {session.isOnline && !!recipientUsername &&
            <TextInput
              inputProps={{
                onChange: (text) => this.handleNoteChange(text),
                value: this.state.note,
                autoCapitalize: 'none',
                multiline: true,
                numberOfLines: 3,
                placeholder: 'Add a note to this transaction',
              }}
              keyboardAvoidance
              inputWrapperStyle={{ marginTop: spacing.medium }}
            />
          }
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  contacts: {
    data: contacts,
    contactsSmartAddresses: { addresses: contactsSmartAddresses },
  },
  session: { data: session },
  history: { gasInfo },
  wallet: { data: wallet },
  accounts: { data: accounts },
  assets: { supportedAssets },
  smartWallet: { connectedAccount: { gasTokenSupported: smartWalletAccountSupportsGasToken } },
}: RootReducerState): $Shape<Props> => ({
  contacts,
  session,
  gasInfo,
  wallet,
  accounts,
  supportedAssets,
  smartWalletAccountSupportsGasToken,
  contactsSmartAddresses,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  activeAccountAddress: activeAccountAddressSelector,
  activeAccount: activeAccountSelector,
  accountAssets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});


const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendCollectibleConfirm);
