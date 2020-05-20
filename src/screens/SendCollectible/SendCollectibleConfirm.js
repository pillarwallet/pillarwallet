// @flow
import * as React from 'react';
import styled from 'styled-components/native';
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
import { addressesEqual, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { getAccountName } from 'utils/accounts';
import { formatTransactionFee, getEthereumProvider } from 'utils/common';
import { buildTxFeeInfo } from 'utils/smartWallet';

// services
import smartWalletService from 'services/smartWallet';
import { buildERC721TransactionData, calculateGasEstimate, fetchRinkebyETHBalance } from 'services/assets';

// selectors
import {
  activeAccountAddressSelector,
  activeAccountSelector,
} from 'selectors';
import { accountBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';
import {
  isActiveAccountSmartWalletSelector,
  useGasTokenSelector,
} from 'selectors/smartWallet';

// types
import type { CollectibleTransactionPayload, TransactionFeeInfo } from 'models/Transaction';
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
  balances: Balances,
  contactsSmartAddresses: ContactSmartAddressData[],
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

    const txFeeInfo = isSmartAccount
      ? await this.getSmartWalletTxFee(transactionPayload)
      : await this.getKeyWalletTxFee(transactionPayload);

    this.setState({ txFeeInfo, gettingFee: false });
  };

  getKeyWalletTxFee = async (transaction: CollectibleTransactionPayload): Promise<TransactionFeeInfo> => {
    const { gasInfo } = this.props;
    const gasPrice = gasInfo.gasPrice[SPEED_TYPES.NORMAL] || 0;
    const gasPriceWei = utils.parseUnits(gasPrice.toString(), 'gwei');
    const gasLimit = await calculateGasEstimate(transaction);
    this.setState({ gasLimit });

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

  handleNoteChange(text) {
    this.setState({ note: text });
  }

  render() {
    const {
      contacts,
      session,
      accounts,
      contactsSmartAddresses,
      balances,
    } = this.props;
    const { rinkebyETH, gettingFee, txFeeInfo } = this.state;
    const { name } = this.assetData;

    // recipient
    const to = this.receiver;
    const contact = findMatchingContact(to, contacts, contactsSmartAddresses);
    const recipientUsername = getUserName(contact);
    const userAccount = !recipientUsername ? accounts.find(({ id }) => addressesEqual(id, to)) : null;

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
    const errorMessage = !isEnoughForFee && `Not enough ${feeSymbol} for transaction fee`;

    // confirm button
    const isConfirmDisabled = gettingFee || !session.isOnline || !txFeeInfo || !isEnoughForFee;
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
          {this.isRopstenNetwork &&
            <LabeledRow>
              <Label>Balance in Rinkeby ETH (visible in dev and staging while on Ropsten)</Label>
              <Value>{rinkebyETH} ETH</Value>
            </LabeledRow>
          }
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
}: RootReducerState): $Shape<Props> => ({
  contacts,
  session,
  gasInfo,
  wallet,
  accounts,
  supportedAssets,
  contactsSmartAddresses,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  activeAccountAddress: activeAccountAddressSelector,
  activeAccount: activeAccountSelector,
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
