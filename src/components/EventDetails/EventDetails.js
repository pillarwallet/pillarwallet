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
import { View, Linking } from 'react-native';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import styled, { withTheme } from 'styled-components/native';
import { SafeAreaView } from 'react-navigation';
import { format as formatDate } from 'date-fns';
import { CachedImage } from 'react-native-cached-image';
import { utils } from 'ethers';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import { TX_DETAILS_URL, BITCOIN_TX_DETAILS_URL, SDK_PROVIDER } from 'react-native-dotenv';

// components
import { BaseText, MediumText } from 'components/Typography';
import { Spacing } from 'components/Layout';
import Button from 'components/Button';
import SlideModal from 'components/Modals/SlideModal';
import ProfileImage from 'components/ProfileImage';
import Icon from 'components/Icon';
import TankAssetBalance from 'components/TankAssetBalance';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import SWActivationModal from 'components/SWActivationModal';

// utils
import { spacing, fontStyles, fontSizes } from 'utils/variables';
import { themedColors, getThemeColors } from 'utils/themes';
import { getRate, getAssetData, getAssetsAsList } from 'utils/assets';
import {
  formatFiat,
  formatAmount,
  formatUnits,
  formatTransactionFee,
  reportOrWarn,
} from 'utils/common';
import {
  groupPPNTransactions,
  isPendingTransaction,
  isSWAddress,
  isKWAddress,
  isBTCAddress,
} from 'utils/feedData';
import { createAlert } from 'utils/alerts';
import { findMatchingContact } from 'utils/contacts';
import { getActiveAccount, getKeyWalletAddress, getSmartWalletAddress } from 'utils/accounts';
import { images } from 'utils/images';

// constants
import { BTC, defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import {
  TYPE_RECEIVED,
  TYPE_ACCEPTED,
  TYPE_REJECTED,
  TYPE_SENT,
} from 'constants/invitationsConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { TRANSACTION_EVENT, TX_PENDING_STATUS, TX_CONFIRMED_STATUS } from 'constants/historyConstants';
import {
  PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT,
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_TX_SETTLEMENT,
} from 'constants/paymentNetworkConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { USER_EVENT, PPN_INIT_EVENT, WALLET_CREATE_EVENT, WALLET_BACKUP_EVENT } from 'constants/userEventsConstants';
import { BADGE_REWARD_EVENT } from 'constants/badgesConstants';
import {
  SET_SMART_WALLET_ACCOUNT_ENS,
  SMART_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER,
} from 'constants/smartWalletConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import {
  BADGE,
  CHAT,
  SEND_TOKEN_FROM_CONTACT_FLOW,
  TANK_FUND_FLOW,
  SEND_TOKEN_AMOUNT,
  SEND_TOKEN_FROM_HOME_FLOW,
  SEND_SYNTHETIC_ASSET,
  SETTLE_BALANCE,
  TANK_WITHDRAWAL_FLOW,
} from 'constants/navigationConstants';

// selectors
import {
  PPNTransactionsSelector,
  isPPNActivatedSelector,
  combinedPPNTransactionsSelector,
} from 'selectors/paymentNetwork';
import {
  activeAccountAddressSelector,
  bitcoinAddressSelector,
  isSmartWalletActivatedSelector,
} from 'selectors';
import { assetDecimalsSelector, accountAssetsSelector } from 'selectors/assets';
import { activeBlockchainSelector } from 'selectors/selectors';

// actions
import { switchAccountAction } from 'actions/accountsActions';
import { goToInvitationFlowAction } from 'actions/referralsActions';
import { updateTransactionStatusAction } from 'actions/historyActions';
import { lookupAddressAction } from 'actions/ensRegistryActions';
import { setActiveBlockchainNetworkAction } from 'actions/blockchainNetworkActions';
import { refreshBitcoinBalanceAction } from 'actions/bitcoinActions';

// types
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { Rates, Assets, Asset, AssetData } from 'models/Asset';
import type { ContactSmartAddressData, ApiUser } from 'models/Contacts';
import type { Theme } from 'models/Theme';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { Accounts } from 'models/Account';
import type { Transaction } from 'models/Transaction';
import type { BitcoinAddress } from 'models/Bitcoin';
import type { TransactionsGroup } from 'utils/feedData';
import type { NavigationScreenProp } from 'react-navigation';
import type { EventData as PassedEventData } from 'components/ActivityFeed/ActivityFeedItem';


type Props = {
  theme: Theme,
  navigation: NavigationScreenProp<*>,
  event: Object,
  isVisible: boolean,
  onClose: (?(() => void)) => void,
  rejectInvitation: (event: Object) => void,
  acceptInvitation: (event: Object) => void,
  rates: Rates,
  baseFiatCurrency: ?string,
  contacts: ApiUser[],
  contactsSmartAddresses: ContactSmartAddressData[],
  user: Object,
  accounts: Accounts,
  ensRegistry: EnsRegistry,
  supportedAssets: Asset[],
  PPNTransactions: Transaction[],
  mergedPPNTransactions: Transaction[],
  isSmartWalletActivated: boolean,
  assetDecimals: number,
  activeAccountAddress: string,
  accountAssets: Assets,
  activeBlockchainNetwork: string,
  bitcoinAddresses: BitcoinAddress[],
  switchAccount: (accountId: string) => void,
  goToInvitationFlow: () => void,
  isPPNActivated: boolean,
  updateTransactionStatus: (hash: string) => void,
  lookupAddress: (address: string) => void,
  history: {[string]: Object[]},
  itemData: Object,
  isForAllAccounts?: boolean,
  storybook?: boolean,
  bitcoinFeatureEnabled?: boolean,
  setActiveBlockchainNetwork: (id: string) => void,
  refreshBitcoinBalance: () => void,
};

type State = {
  isReceiveModalVisible: boolean,
  SWActivationModalVisible: boolean,
  receiveWalletAddress: string,
};

type EventData = {
  date?: number,
  name?: string,
  imageUrl?: string,
  itemImageSource?: string,
  profileImage?: string,
  iconName?: ?string,
  iconColor?: ?string,
  actionTitle?: string,
  actionSubtitle?: ?string,
  actionIcon?: ?string,
  customActionTitle?: React.Node,
  buttons?: Object[],
  fee?: ?string,
  settleEventData?: Object,
  username?: string,
  imageBorder?: boolean,
  imageBackground?: ?string,
};

const Wrapper = styled(SafeAreaView)`
  padding: 16px 0 40px;
  align-items: center;
`;

const ButtonsContainer = styled.View`
  align-self: stretch;
`;

const TokenImage = styled(CachedImage)`
  width: 64px;
  height: 64px;
  border-radius: 64px;
`;

const IconCircle = styled.View`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background-color: ${props => props.backgroundColor || themedColors.tertiary};
  align-items: center;
  justify-content: center;
  text-align: center;
  ${({ border, theme }) => border &&
  `border-color: ${theme.colors.border};
    border-width: 1px;`};
`;

const ItemIcon = styled(Icon)`
  font-size: 64px;
  color: ${({ iconColor, theme }) => iconColor || theme.colors.primary};
`;

const ActionIcon = styled(Icon)`
  margin-left: 4px;
  color: ${themedColors.secondaryText};
  ${fontStyles.large};
`;

const ActionWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const SettleWrapper = styled.View`
  width: 100%;
  padding: 0 ${spacing.layoutSides}px 36px;
`;

const Divider = styled.View`
  width: 100%;
  height: 1px;
  background-color: ${themedColors.tertiary};
  margin: 8px 0px 18px;
`;


export class EventDetail extends React.Component<Props, State> {
  timer: ?IntervalID;
  timeout: ?TimeoutID;

  state = {
    isReceiveModalVisible: false,
    SWActivationModalVisible: false,
    receiveWalletAddress: '',
  };

  componentDidMount() {
    if (this.props.event.type !== TRANSACTION_EVENT) return;
    const txInfo = this.findTxInfo();
    this.syncEnsRegistry(txInfo);
    this.syncTxStatus(txInfo);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.event.type !== TRANSACTION_EVENT) return;
    const txInfo = this.findTxInfo();
    if (!prevProps.isVisible && this.props.isVisible) {
      this.syncEnsRegistry(txInfo);
      this.syncTxStatus(txInfo);
    }
    if (prevProps.isVisible && !this.props.isVisible) {
      this.cleanup();
    }
    if (txInfo.status !== TX_PENDING_STATUS && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  componentWillUnmount() {
    this.cleanup();
  }

  cleanup() {
    if (this.timer) clearInterval(this.timer);
    if (this.timeout) clearTimeout(this.timeout);
  }

  findTxInfo = () => {
    const { history, event } = this.props;
    const accountsHistory: Object[] = Object.values(history);
    return accountsHistory
      .map(accountHistory => accountHistory.find(tx => tx.hash === event.hash))
      .find(tx => tx) || {};
  }

  syncEnsRegistry = (txInfo: Transaction) => {
    const { ensRegistry, lookupAddress } = this.props;
    const relatedAddress = this.getRelevantAddress(txInfo);

    if (!ensRegistry[relatedAddress]) {
      lookupAddress(relatedAddress);
    }
  }

  syncTxStatus = (txInfo: Transaction) => {
    const {
      event,
      updateTransactionStatus,
    } = this.props;
    if (txInfo.status === TX_PENDING_STATUS) {
      this.timeout = setTimeout(() => updateTransactionStatus(event.hash), 500);
      this.timer = setInterval(() => updateTransactionStatus(event.hash), 10000);
    }

    if (txInfo.status === TX_CONFIRMED_STATUS && (!txInfo.gasUsed || !txInfo.gasPrice)) {
      updateTransactionStatus(event.hash);
    }
  };

  getRelevantAddress = (event: Object): string => {
    const { itemData } = this.props;
    const { isReceived } = itemData;
    return isReceived ? event.from : event.to;
  };

  getFeeLabel = () => {
    const {
      event, baseFiatCurrency, rates, assetDecimals,
    } = this.props;
    const {
      gasUsed, gasPrice, btcFee, feeWithGasToken,
    } = event;

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    if (!isEmpty(feeWithGasToken)) {
      return `Fee ${formatTransactionFee(feeWithGasToken.feeInWei, get(feeWithGasToken, 'gasToken'))}`;
    }

    if (gasUsed) {
      const fee = gasUsed && gasPrice ? Math.round(gasUsed * gasPrice) : 0;
      const formattedFee = parseFloat(utils.formatEther(fee.toString()));
      const rate = getRate(rates, ETH, fiatCurrency);
      const formattedFiatValue = formatFiat(formattedFee * rate, fiatCurrency);
      return `Fee ${formattedFee} ETH (${formattedFiatValue})`;
    } else if (btcFee) {
      const formattedBTCFee = parseFloat(formatUnits(btcFee, assetDecimals));
      const btcRate = getRate(rates, BTC, fiatCurrency);
      const formattedFiatValue = formatFiat(formattedBTCFee * btcRate, fiatCurrency);
      return `Fee ${formattedBTCFee} BTC (${formattedFiatValue})`;
    }
    return null;
  };

  messageContact = (contact: ApiUser) => {
    this.props.navigation.navigate(CHAT, { username: contact.username });
    this.props.onClose();
  };

  sendTokensToContact = (contact: ApiUser) => {
    this.props.navigation.navigate(SEND_TOKEN_FROM_CONTACT_FLOW, { contact });
    this.props.onClose();
  };

  sendTokensToAddress = (address: string) => {
    const { ensRegistry } = this.props;
    this.props.navigation.navigate(SEND_TOKEN_FROM_CONTACT_FLOW, {
      contact: {
        ethAddress: address,
        username: ensRegistry[address] || address,
      },
    });
    this.props.onClose();
  };

  acceptInvitation = () => {
    const { event, onClose, acceptInvitation } = this.props;
    onClose();
    acceptInvitation(event);
  };

  rejectInvitation = () => {
    const { event, onClose, rejectInvitation } = this.props;
    createAlert(TYPE_REJECTED, event, () => {
      onClose();
      rejectInvitation(event);
    });
  };

  viewOnTheBlockchain = () => {
    const { hash, asset } = this.props.event;
    let url = TX_DETAILS_URL + hash;
    if (asset && asset === 'BTC') {
      url = BITCOIN_TX_DETAILS_URL + hash;
    }
    Linking.openURL(url);
  };

  viewBadge = () => {
    const { navigation, event, onClose } = this.props;
    const { badgeId } = event;
    onClose();
    navigation.navigate(BADGE, { badgeId });
  };

  switchToKW = async () => {
    const {
      accounts, switchAccount,
    } = this.props;
    const keyBasedAccount = accounts.find((acc) => acc.type === ACCOUNT_TYPES.KEY_BASED) || {};
    const { type: activeAccType } = getActiveAccount(accounts) || {};
    if (activeAccType !== ACCOUNT_TYPES.KEY_BASED) {
      await switchAccount(keyBasedAccount.id);
    }
  };

  switchToSW = async () => {
    const {
      accounts, switchAccount,
    } = this.props;
    const swAccount = accounts.find((acc) => acc.type === ACCOUNT_TYPES.SMART_WALLET) || {};
    const { type: activeAccType } = getActiveAccount(accounts) || {};
    if (activeAccType !== ACCOUNT_TYPES.SMART_WALLET) {
      await switchAccount(swAccount.id);
    }
  }

  switchToBTC = async () => {
    const {
      accounts, switchAccount,
    } = this.props;
    const swAccount = accounts.find((acc) => acc.type === ACCOUNT_TYPES.SMART_WALLET) || {};
    const { type: activeAccType } = getActiveAccount(accounts) || {};
    if (activeAccType !== ACCOUNT_TYPES.SMART_WALLET) {
      await switchAccount(swAccount.id);
    }
  };

  showReceiveModal = (receiveWalletAddress: string) => {
    this.props.onClose(() => this.setState({ isReceiveModalVisible: true, receiveWalletAddress }));
  };

  topUpKeyWallet = () => {
    const { accounts } = this.props;
    const keyWalletAddress = getKeyWalletAddress(accounts);
    if (!keyWalletAddress) return;
    this.showReceiveModal(keyWalletAddress);
  };

  topUpSW = () => {
    const { accounts } = this.props;
    const smartWalletAddress = getSmartWalletAddress(accounts);
    if (!smartWalletAddress) return;
    this.showReceiveModal(smartWalletAddress);
  };

  referFriends = () => {
    const { onClose, goToInvitationFlow } = this.props;
    onClose();
    goToInvitationFlow();
  };

  activateSW = () => {
    this.props.onClose(() => this.setState({ SWActivationModalVisible: true }));
  };

  sendETHFromKWToSW = async () => {
    const {
      onClose, navigation, accounts, accountAssets, supportedAssets,
    } = this.props;
    const SWAccount = accounts.find((acc) => acc.type === ACCOUNT_TYPES.SMART_WALLET) || {};

    const assetsData = getAssetsAsList(accountAssets);
    const assetData = getAssetData(assetsData, supportedAssets, ETH);
    const fullIconUrl = `${SDK_PROVIDER}/${assetData.iconUrl}?size=3`;
    const fullIconMonoUrl = `${SDK_PROVIDER}/${assetData.iconMonoUrl}?size=2`;

    const params = {
      assetData: {
        token: assetData.symbol,
        contractAddress: assetData.address,
        decimals: assetData.decimals,
        icon: fullIconMonoUrl,
        iconColor: fullIconUrl,
      },
      receiver: SWAccount.id,
      source: 'Home',
    };

    onClose();
    await this.switchToKW();
    navigation.navigate(SEND_TOKEN_AMOUNT, params);
  };

  topUpPillarNetwork = async () => {
    const { onClose, navigation } = this.props;
    onClose();
    await this.switchToSW();
    navigation.navigate(TANK_FUND_FLOW);
  };

  PPNWithdraw = async () => {
    const { onClose, navigation } = this.props;
    onClose();
    await this.switchToSW();
    navigation.navigate(TANK_WITHDRAWAL_FLOW);
  };

  send = async (isFromKW?: boolean) => {
    const { onClose, navigation } = this.props;
    onClose();
    if (!isFromKW) {
      await this.switchToSW();
    } else {
      await this.switchToKW();
    }
    navigation.navigate(SEND_TOKEN_FROM_HOME_FLOW);
  };

  sendSynthetic = async () => {
    const { onClose, navigation } = this.props;
    onClose();
    await this.switchToSW();
    navigation.navigate(SEND_SYNTHETIC_ASSET);
  };

  settle = async () => {
    const { onClose, navigation } = this.props;
    onClose();
    await this.switchToSW();
    navigation.navigate(SETTLE_BALANCE);
  };

  sendToBtc = async (btcReceiverAddress: string) => {
    const {
      onClose,
      navigation,
      supportedAssets,
      setActiveBlockchainNetwork,
      refreshBitcoinBalance,
    } = this.props;
    onClose();
    setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.BITCOIN);
    refreshBitcoinBalance();
    const btcToken = supportedAssets.find(e => e.symbol === BTC);

    if (!btcToken) {
      reportOrWarn('BTC token not found', null, 'error');
      return;
    }

    const { symbol: token, decimals } = btcToken;

    const iconUrl = `${SDK_PROVIDER}/${btcToken.iconUrl}?size=2`;

    const assetData: AssetData = {
      token,
      decimals,
      iconColor: iconUrl,
    };

    navigation.navigate(SEND_TOKEN_AMOUNT, {
      assetData,
      receiver: btcReceiverAddress,
      source: 'Contact',
      receiverEnsName: '',
    });
  };

  getWalletCreatedEventData = (event: Object): ?EventData => {
    const { isSmartWalletActivated } = this.props;
    const keyWalletButtons = [
      {
        title: 'Top up',
        onPress: this.topUpKeyWallet,
        secondary: true,
      },
      {
        title: 'Refer friends',
        onPress: this.referFriends,
        squarePrimary: true,
      },
    ];

    switch (event.eventTitle) {
      case 'Wallet created':
        return {
          buttons: keyWalletButtons,
        };
      case 'Smart Wallet created':
        const activateButton = {
          title: 'Activate',
          onPress: this.activateSW,
          secondary: true,
        };

        const topUpButton = {
          title: 'Top Up',
          onPress: this.topUpSW,
          secondary: true,
        };

        const topUpButtonSecondary = {
          title: 'Top Up',
          onPress: this.topUpSW,
          squarePrimary: true,
        };

        return {
          buttons: isSmartWalletActivated ? [topUpButton] : [activateButton, topUpButtonSecondary],
        };
      case 'Wallet imported':
        return {
          primaryButtonTitle: 'Top up',
          secondaryButtonTitle: 'Refer friends',
          buttons: keyWalletButtons,
        };
      default:
        return null;
    }
  };

  getUserEventData = (event: Object): ?EventData => {
    const { isPPNActivated } = this.props;

    switch (event.subType) {
      case WALLET_CREATE_EVENT:
        return this.getWalletCreatedEventData(event);
      case PPN_INIT_EVENT:
        if (isPPNActivated) {
          return {
            actionTitle: 'Activated',
            buttons: [
              {
                title: 'Send',
                onPress: this.sendSynthetic,
                secondary: true,
              },
              {
                title: 'Top up',
                onPress: this.topUpPillarNetwork,
                squarePrimary: true,
              },
            ],
          };
        }
        return {
          actionTitle: 'Created',
          buttons: [
            {
              title: 'Activate',
              onPress: this.topUpPillarNetwork,
            },
          ],
        };

      case WALLET_BACKUP_EVENT:
        return {
          buttons: [
            {
              title: 'Top up',
              onPress: this.topUpKeyWallet,
              secondary: true,
            },
            {
              title: 'Refer friends',
              onPress: this.referFriends,
              squarePrimary: true,
            },
          ],
        };
      default:
        return null;
    }
  };

  getTransactionEventData = (event: Object): ?EventData => {
    const {
      assetDecimals,
      accounts,
      contacts,
      contactsSmartAddresses,
      isPPNActivated,
      itemData,
      bitcoinAddresses,
      bitcoinFeatureEnabled,
    } = this.props;
    const value = formatUnits(event.value, assetDecimals);
    const relevantAddress = this.getRelevantAddress(event);
    const contact = findMatchingContact(relevantAddress, contacts, contactsSmartAddresses) || {};
    const {
      itemValue,
      subtext,
      isBetweenAccounts,
      isReceived,
    } = itemData;
    const formattedValue = formatAmount(value);

    let directionSymbol = isReceived ? '+' : '-';

    if (formattedValue === '0') {
      directionSymbol = '';
    }

    const isPending = isPendingTransaction(event);

    let eventData: ?EventData = null;

    switch (event.tag) {
      case PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT:
        const activatePillarNetworkButton = {
          title: 'Activate Pillar Network',
          onPress: this.topUpPillarNetwork,
          secondary: true,
        };

        const referFriendsButton = {
          title: 'Refer friends',
          onPress: this.referFriends,
          secondary: true,
        };

        const referFriendsButtonSecondary = {
          title: 'Refer friends',
          onPress: this.referFriends,
          squarePrimary: true,
        };

        eventData = {
          actionTitle: 'Activated',
          actionSubtitle: this.getFeeLabel(),
          buttons: isPPNActivated ? [referFriendsButton] : [activatePillarNetworkButton, referFriendsButtonSecondary],
        };
        break;
      case PAYMENT_NETWORK_ACCOUNT_TOPUP:
        eventData = {
          buttons: [
            isPending ?
              {
                title: 'View on the blockchain',
                onPress: this.viewOnTheBlockchain,
                secondary: true,
              } :
              {
                title: 'Send',
                onPress: this.sendSynthetic,
                secondary: true,
              },
            {
              title: 'Top up more',
              onPress: this.topUpPillarNetwork,
              squarePrimary: true,
            },
          ],
        };
        break;
      case SET_SMART_WALLET_ACCOUNT_ENS:
        eventData = {
          name: 'ENS name',
          actionTitle: 'Registered',
          actionSubtitle: event.extra.ensName,
          buttons: [
            {
              title: 'View on the blockchain',
              onPress: this.viewOnTheBlockchain,
              secondary: true,
            },
          ],
        };
        break;
      case PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL:
        eventData = {
          buttons: [
            {
              title: 'Withdraw more',
              onPress: this.PPNWithdraw,
              secondary: true,
            },
          ],
        };
        break;
      case PAYMENT_NETWORK_TX_SETTLEMENT:
        eventData = {
          settleEventData: event,
          buttons: [
            {
              title: 'Settle more',
              onPress: this.settle,
              secondary: true,
            },
          ],
        };
        break;
      case SMART_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER:
        eventData = {
          name: 'Smart Wallet fees with PLR',
          actionTitle: 'Enabled',
          buttons: [
            {
              title: 'View on the blockchain',
              onPress: this.viewOnTheBlockchain,
              secondary: true,
            },
          ],
        };
        break;
      default:
        const isPPNTransaction = get(event, 'isPPNTransaction', false);
        const isTrxBetweenSWAccount = isSWAddress(event.from, accounts) && isSWAddress(event.to, accounts);

        if (isPPNTransaction) {
          eventData = {
            customActionTitle: !isTrxBetweenSWAccount && (
              <TankAssetBalance
                amount={`${directionSymbol} ${formattedValue} ${event.asset}`}
                textStyle={{ fontSize: fontSizes.large }}
                iconStyle={{ height: 14, width: 8, marginRight: 9 }}
              />
            ),
            actionSubtitle: !isTrxBetweenSWAccount ? `${isReceived ? 'to' : 'from'} Pillar Network` : '',
          };

          if (isReceived) {
            if (isTrxBetweenSWAccount) {
              eventData.buttons = [];
            } else {
              eventData.buttons = [
                {
                  title: 'Message',
                  onPress: () => this.messageContact(contact),
                  secondary: true,
                },
                {
                  title: 'Send back',
                  onPress: this.sendSynthetic,
                  squarePrimary: true,
                },
              ];
            }
          } else {
            eventData.buttons = [
              {
                title: 'Send more',
                onPress: this.sendSynthetic,
                secondary: true,
              },
            ];
          }
        } else {
          eventData = {
            actionTitle: itemValue,
            actionSubtitle: subtext,
          };

          let buttons = [];
          const contactFound = Object.keys(contact).length > 0;
          const isBitcoinTrx = isBTCAddress(event.to, bitcoinAddresses) || isBTCAddress(event.from, bitcoinAddresses);
          const isFromKWToSW = isKWAddress(event.from, accounts) && isSWAddress(event.to, accounts);

          const messageButton = {
            title: 'Message',
            onPress: () => this.messageContact(contact),
            secondary: true,
          };

          const viewOnBlockchainButton = {
            title: 'View on the blockchain',
            onPress: this.viewOnTheBlockchain,
            secondary: true,
          };

          const viewOnBlockchainButtonSecondary = {
            title: 'View on the blockchain',
            onPress: this.viewOnTheBlockchain,
            squarePrimary: true,
          };

          const sendBackButtonSecondary = {
            title: 'Send back',
            onPress: () => this.sendTokensToContact(contact),
            squarePrimary: true,
          };

          const inviteToPillarButton = {
            title: 'Invite to Pillar',
            onPress: this.referFriends,
            squarePrimary: true,
          };

          const sendMoreButtonSecondary = {
            title: 'Send more',
            onPress: () => this.sendTokensToContact(contact),
            squarePrimary: true,
          };

          const sendBackToAddress = {
            title: 'Send back',
            onPress: () => this.sendTokensToAddress(relevantAddress),
            secondary: true,
          };

          const sendMoreToAddress = {
            title: 'Send more',
            onPress: () => this.sendTokensToAddress(relevantAddress),
            secondary: true,
          };

          const sendFromKW = {
            title: 'Send',
            onPress: () => this.send(true),
            secondary: true,
          };

          const sendFromSW = {
            title: 'Send',
            onPress: () => this.send(),
            secondary: true,
          };

          const topUpMore = {
            title: 'Top up more',
            onPress: this.sendETHFromKWToSW,
            squarePrimary: true,
          };

          const sendBackBtc = {
            title: 'Send back',
            onPress: () => this.sendToBtc(event.from),
            secondary: true,
          };

          const sendMoreBtc = {
            title: 'Send more',
            onPress: () => this.sendToBtc(event.from),
            secondary: true,
          };

          if (isReceived) {
            if (isFromKWToSW) {
              buttons = [sendFromSW, topUpMore];
            } else if (isKWAddress(event.to, accounts) && isSWAddress(event.from, accounts)) {
              buttons = [sendFromKW];
            } else if (isBitcoinTrx) {
              buttons = bitcoinFeatureEnabled ? [sendBackBtc] : [];
            } else if (contactFound) {
              buttons = isPending
                ? [messageButton, viewOnBlockchainButtonSecondary]
                : [messageButton, sendBackButtonSecondary];
            } else if (isPending) {
              buttons = [viewOnBlockchainButton, inviteToPillarButton];
            } else {
              buttons = [sendBackToAddress, inviteToPillarButton];
            }
          } else if (isBitcoinTrx) {
            buttons = bitcoinFeatureEnabled ? [sendMoreBtc] : [];
          } else if (contactFound) {
            buttons = isPending
              ? [messageButton, viewOnBlockchainButtonSecondary]
              : [messageButton, sendMoreButtonSecondary];
          } else if (isPending) {
            buttons = [viewOnBlockchainButton, inviteToPillarButton];
          } else if (isBetweenAccounts) {
            buttons = isFromKWToSW ? [topUpMore] : [sendMoreToAddress];
          } else {
            buttons = [sendMoreToAddress, inviteToPillarButton];
          }
          eventData.buttons = buttons;
          if (!isReceived) {
            eventData.fee = this.getFeeLabel();
          }
        }
    }
    if (isPending) {
      eventData.actionIcon = 'pending';
    }
    return eventData;
  };

  getCollectibleTransactionEventData = (event: Object): EventData => {
    const { itemData } = this.props;
    const { subtext, isReceived } = itemData;

    let eventData: EventData = {
      actionSubtitle: subtext,
    };

    if (isReceived) {
      eventData = {
        ...eventData,
        buttons: [
          {
            title: 'View on the Blockchain',
            onPress: this.viewOnTheBlockchain,
            secondary: true,
          },
        ],
      };
    }

    if (isPendingTransaction(event)) {
      eventData.actionIcon = 'pending';
    }

    return eventData;
  };

  getBadgeRewardEventData = (event: Object): EventData => {
    const { name, imageUrl } = event;

    const viewBadgeButton = {
      title: 'View badge',
      onPress: this.viewBadge,
      secondary: true,
    };

    const viewOnBlockchainButton = {
      title: 'View on the blockchain',
      onPress: this.viewOnTheBlockchain,
      squarePrimary: true,
    };

    const isPending = isPendingTransaction(event);

    return {
      name,
      imageUrl,
      actionTitle: 'Received',
      actionSubtitle: 'Badge',
      actionIcon: isPending ? 'pending' : null,
      buttons: isPending ? [viewBadgeButton] : [viewBadgeButton, viewOnBlockchainButton],
    };
  };

  getSocialEventData = (event: Object): ?EventData => {
    const { contacts } = this.props;
    const { type, username, profileImage } = event;
    const acceptedContact = contacts.find(contact => contact.username === username);

    if (type === TYPE_RECEIVED) {
      return {
        name: username,
        profileImage,
        actionTitle: 'Connection request',
        buttons: [
          {
            title: 'Accept',
            onPress: this.acceptInvitation,
            secondary: true,
          },
          {
            title: 'Reject',
            onPress: this.rejectInvitation,
            secondaryDanger: true,
          },
        ],
        username,
      };
    }

    if (!acceptedContact) return null;

    if (type === TYPE_ACCEPTED) {
      return {
        name: username,
        profileImage,
        actionTitle: 'Connected',
        buttons: [
          {
            title: 'Message',
            onPress: () => this.messageContact(acceptedContact),
            secondary: true,
          },
          {
            title: 'Send tokens',
            onPress: () => this.sendTokensToContact(acceptedContact),
            squarePrimary: true,
          },
        ],
        username,
      };
    }

    return null;
  };

  getEventData = (event: Object): ?EventData => {
    let eventData = null;
    switch (event.type) {
      case USER_EVENT:
        eventData = this.getUserEventData(event);
        break;
      case TRANSACTION_EVENT:
        eventData = this.getTransactionEventData(event);
        break;
      case COLLECTIBLE_TRANSACTION:
        eventData = this.getCollectibleTransactionEventData(event);
        break;
      case BADGE_REWARD_EVENT:
        eventData = this.getBadgeRewardEventData(event);
        break;
      case TYPE_SENT:
      case TYPE_RECEIVED:
      case TYPE_ACCEPTED:
        eventData = this.getSocialEventData(event);
        break;
      default:
        eventData = null;
    }
    if (eventData) {
      eventData = {
        ...eventData,
        date: event.createdAt,
      };
    }
    return eventData;
  };

  renderImage = (itemData: PassedEventData) => {
    const { theme } = this.props;
    const {
      itemImageUrl, itemImageSource, avatarUrl, label, iconName, iconColor, iconBackgroundColor, iconBorder,
    } = itemData;
    const { genericToken: fallbackSource } = images(theme);
    if (itemImageUrl) {
      return (
        <IconCircle border={iconBorder} backgroundColor={this.getColor(iconBackgroundColor)}>
          <TokenImage source={{ uri: itemImageUrl }} fallbackSource={fallbackSource} />
        </IconCircle>
      );
    }
    if (itemImageSource) {
      return <TokenImage source={itemImageSource} />;
    }
    if (iconName) {
      return (
        <IconCircle>
          <ItemIcon name={iconName} iconColor={this.getColor(iconColor)} />
        </IconCircle>
      );
    }

    return (
      <ProfileImage
        uri={avatarUrl}
        userName={label}
        noShadow
        borderWidth={0}
        diameter={64}
      />
    );
  };

  getColor = (color: ?string): ?string => {
    if (!color) return null;
    const { theme } = this.props;
    const colors = getThemeColors(theme);
    return colors[color] || color;
  };

  renderSettle = (settleEventData: Object) => {
    const { PPNTransactions, isForAllAccounts, mergedPPNTransactions } = this.props;
    const mappedTransactions = isForAllAccounts
      ? settleEventData.extra.reduce((mapped, event) => {
        const relatedTrx = mergedPPNTransactions.find(tx => tx.hash === event.hash);
        if (relatedTrx) return [...mapped, relatedTrx];
        return mapped;
      }, [])
      : settleEventData.extra.reduce((mapped, event) => {
        const relatedTrx = PPNTransactions.find(tx => tx.hash === event.hash);
        if (relatedTrx) return [...mapped, relatedTrx];
        return mapped;
      }, []);

    const groupedTransactions: TransactionsGroup[] = groupPPNTransactions(mappedTransactions);

    return (
      <SettleWrapper>
        {!!groupedTransactions && groupedTransactions.map(group => (
          <React.Fragment key={group.symbol}>
            <Row marginBottom={10}>
              <BaseText regular synthetic>From Pillar Tank</BaseText>
              <TankAssetBalance
                amount={`- ${formatUnits(group.value.toString(), 18)} ${group.symbol}`}
                textStyle={{ fontSize: fontSizes.big }}
                iconStyle={{ height: 14, width: 8, marginRight: 9 }}
              />
            </Row>
            {group.transactions.map(({
              createdAt, asset, value, hash,
            }) => {
              const formattedDate = formatDate(new Date(createdAt * 1000), 'MMM D HH:mm');
              const formattedAmount = formatAmount(formatUnits(value.toString(), 18));
              return (
                <Row marginBottom={13} key={hash}>
                  <BaseText secondary tiny>{formattedDate}</BaseText>
                  <BaseText secondary small>-{formattedAmount} {asset}</BaseText>
                </Row>
              );
            })}
          </React.Fragment>
        ))}
        <Divider />
        <Row>
          <BaseText regular positive>To Smart Wallet</BaseText>
          <View>
            {groupedTransactions.map(({ value, symbol }) => (
              <BaseText positive large key={symbol}>+ {formatUnits(value.toString(), 18)} {symbol}</BaseText>
            ))}
          </View>
        </Row>
      </SettleWrapper>
    );
  };

  renderContent = (eventData: EventData) => {
    const { itemData } = this.props;
    const {
      date, name,
      actionTitle, actionSubtitle, actionIcon, customActionTitle,
      buttons = [], settleEventData, fee,
    } = eventData;

    const {
      label: itemLabel,
      actionLabel,
      itemValue,
      subtext,
      valueColor,
    } = itemData;

    const title = actionTitle || actionLabel || itemValue;
    const label = name || itemLabel;
    const subtitle = (actionSubtitle || itemValue) ? actionSubtitle || subtext : null;
    const titleColor = this.getColor(valueColor);

    const eventTime = date && formatDate(new Date(date * 1000), 'MMMM D, YYYY HH:mm');

    return (
      <Wrapper forceInset={{ top: 'never', bottom: 'always' }}>
        <BaseText tiny secondary>{eventTime}</BaseText>
        <Spacing h={10} />
        <BaseText medium>{label}</BaseText>
        <Spacing h={20} />
        {this.renderImage(itemData)}
        <Spacing h={20} />
        {settleEventData ? this.renderSettle(settleEventData) : (
          <React.Fragment>
            <ActionWrapper>
              {!!title && <MediumText large color={titleColor}>{title}</MediumText>}
              {customActionTitle}
              {!!actionIcon && <ActionIcon name={actionIcon} />}
            </ActionWrapper>
            {subtitle ? (
              <React.Fragment>
                <Spacing h={4} />
                <BaseText regular secondary>{subtitle}</BaseText>
                <Spacing h={24} />
              </React.Fragment>
            ) : (
              <Spacing h={32} />
            )}
            {!!fee && (
              <React.Fragment>
                <BaseText regular secondary>{fee}</BaseText>
                <Spacing h={32} />
              </React.Fragment>
            )}
          </React.Fragment>
        )}
        <ButtonsContainer>
          {buttons.map(buttonProps => (
            <React.Fragment key={buttonProps.title} >
              <Button regularText {...buttonProps} />
              <Spacing h={4} />
            </React.Fragment>
          ))}
        </ButtonsContainer>
      </Wrapper>
    );
  };

  render() {
    const {
      isVisible, onClose, navigation, storybook,
    } = this.props;
    const {
      isReceiveModalVisible,
      SWActivationModalVisible,
      receiveWalletAddress,
    } = this.state;

    let { event } = this.props;

    if (event.type === TRANSACTION_EVENT) {
      const txInfo = this.findTxInfo();
      event = { ...event, ...txInfo };
    }
    const eventData = this.getEventData(event);
    if (!eventData) return null;

    if (storybook) {
      return this.renderContent(eventData);
    }

    return (
      <React.Fragment>
        <SlideModal
          isVisible={isVisible}
          onModalHide={onClose}
          noClose
          hideHeader
        >
          {this.renderContent(eventData)}
        </SlideModal>
        <ReceiveModal
          isVisible={isReceiveModalVisible}
          address={receiveWalletAddress}
          onModalHide={() => this.setState({ isReceiveModalVisible: false })}
        />
        <SWActivationModal
          isVisible={SWActivationModalVisible}
          onClose={() => this.setState({ SWActivationModalVisible: false })}
          navigation={navigation}
        />
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
  user: { data: user },
  accounts: { data: accounts },
  ensRegistry: { data: ensRegistry },
  assets: { supportedAssets },
  history: { data: history },
  featureFlags: {
    data: {
      BITCOIN_ENABLED: bitcoinFeatureEnabled,
    },
  },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  contacts,
  contactsSmartAddresses,
  user,
  accounts,
  ensRegistry,
  supportedAssets,
  history,
  bitcoinFeatureEnabled,
});

const structuredSelector = createStructuredSelector({
  PPNTransactions: PPNTransactionsSelector,
  mergedPPNTransactions: combinedPPNTransactionsSelector,
  isSmartWalletActivated: isSmartWalletActivatedSelector,
  assetDecimals: assetDecimalsSelector((_, props) => props.event.asset),
  activeAccountAddress: activeAccountAddressSelector,
  accountAssets: accountAssetsSelector,
  activeBlockchainNetwork: activeBlockchainSelector,
  bitcoinAddresses: bitcoinAddressSelector,
  isPPNActivated: isPPNActivatedSelector,
});

const combinedMapStateToProps = (state: RootReducerState, props: Props): $Shape<Props> => ({
  ...structuredSelector(state, props),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  switchAccount: (accountId: string) => dispatch(switchAccountAction(accountId)),
  goToInvitationFlow: () => dispatch(goToInvitationFlowAction()),
  updateTransactionStatus: (hash) => dispatch(updateTransactionStatusAction(hash)),
  lookupAddress: (address) => dispatch(lookupAddressAction(address)),
  setActiveBlockchainNetwork: (id: string) => dispatch(setActiveBlockchainNetworkAction(id)),
  refreshBitcoinBalance: () => dispatch(refreshBitcoinBalanceAction(false)),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(EventDetail));
