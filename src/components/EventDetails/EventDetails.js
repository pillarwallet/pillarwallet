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
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';

// components
import { BaseText, MediumText } from 'components/Typography';
import { Spacing } from 'components/Layout';
import Button from 'components/Button';
import SlideModal from 'components/Modals/SlideModal/SlideModal-old';
import Icon from 'components/Icon';
import TankAssetBalance from 'components/TankAssetBalance';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import SWActivationModal from 'components/SWActivationModal';
import CollectibleImage from 'components/CollectibleImage';
import Spinner from 'components/Spinner';
import ProfileImage from 'components/ProfileImage';
import Modal from 'components/Modal';

// utils
import { spacing, fontStyles, fontSizes } from 'utils/variables';
import { themedColors, getThemeColors } from 'utils/themes';
import { addressesEqual, getRate, getAssetDataByAddress } from 'utils/assets';
import {
  formatFiat,
  formatAmount,
  formatUnits,
  formatTransactionFee,
  findEnsNameCaseInsensitive,
  getDecimalPlaces,
} from 'utils/common';
import {
  groupPPNTransactions,
  isPendingTransaction,
  isSWAddress,
  isFailedTransaction,
  isTimedOutTransaction,
} from 'utils/feedData';
import { getSmartWalletAddress } from 'utils/accounts';
import { images } from 'utils/images';
import { findTransactionAcrossAccounts } from 'utils/history';
import { isAaveTransactionTag } from 'utils/aave';
import { isPoolTogetherAddress } from 'utils/poolTogether';
import { getFormattedValue } from 'utils/strings';

// constants
import { defaultFiatCurrency, ETH, DAI } from 'constants/assetsConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import {
  TRANSACTION_EVENT,
  TRANSACTION_PENDING_EVENT,
  TX_PENDING_STATUS,
  TX_CONFIRMED_STATUS,
} from 'constants/historyConstants';
import {
  PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT,
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_TX_SETTLEMENT,
} from 'constants/paymentNetworkConstants';
import { USER_EVENT, PPN_INIT_EVENT, WALLET_CREATE_EVENT, WALLET_BACKUP_EVENT } from 'constants/userEventsConstants';
import { BADGE_REWARD_EVENT } from 'constants/badgesConstants';
import {
  SET_SMART_WALLET_ACCOUNT_ENS,
  SMART_WALLET_ACCOUNT_DEVICE_ADDED,
  SMART_WALLET_ACCOUNT_DEVICE_REMOVED,
  SMART_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER,
} from 'constants/smartWalletConstants';
import {
  BADGE,
  SEND_TOKEN_FROM_CONTACT_FLOW,
  TANK_FUND_FLOW,
  SEND_TOKEN_FROM_HOME_FLOW,
  SEND_SYNTHETIC_AMOUNT,
  SETTLE_BALANCE,
  TANK_WITHDRAWAL_FLOW,
  LENDING_ENTER_WITHDRAW_AMOUNT,
  LENDING_ENTER_DEPOSIT_AMOUNT,
  LENDING_VIEW_DEPOSITED_ASSET,
  POOLTOGETHER_DASHBOARD,
  POOLTOGETHER_PURCHASE,
  POOLTOGETHER_WITHDRAW,
  SABLIER_INCOMING_STREAM,
  SABLIER_OUTGOING_STREAM,
} from 'constants/navigationConstants';
import { AAVE_LENDING_DEPOSIT_TRANSACTION, AAVE_LENDING_WITHDRAW_TRANSACTION } from 'constants/lendingConstants';
import { POOLTOGETHER_DEPOSIT_TRANSACTION, POOLTOGETHER_WITHDRAW_TRANSACTION } from 'constants/poolTogetherConstants';
import {
  SABLIER_CREATE_STREAM,
  SABLIER_WITHDRAW,
  SABLIER_CANCEL_STREAM,
} from 'constants/sablierConstants';

// selectors
import {
  PPNTransactionsSelector,
  isPPNActivatedSelector,
  combinedPPNTransactionsSelector,
} from 'selectors/paymentNetwork';
import {
  activeAccountAddressSelector,
  activeBlockchainSelector,
} from 'selectors';
import { assetDecimalsSelector, accountAssetsSelector } from 'selectors/assets';
import { isActiveAccountSmartWalletSelector, isSmartWalletActivatedSelector } from 'selectors/smartWallet';
import { combinedCollectiblesHistorySelector } from 'selectors/collectibles';

// actions
import { goToInvitationFlowAction } from 'actions/referralsActions';
import { updateTransactionStatusAction } from 'actions/historyActions';
import { lookupAddressAction } from 'actions/ensRegistryActions';
import { updateCollectibleTransactionAction } from 'actions/collectiblesActions';

// types
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { Rates, Assets, Asset, DepositedAsset } from 'models/Asset';
import type { Theme } from 'models/Theme';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { Accounts } from 'models/Account';
import type { Transaction, TransactionsStore } from 'models/Transaction';
import type { CollectibleTrx } from 'models/Collectible';
import type { TransactionsGroup } from 'utils/feedData';
import type { NavigationScreenProp } from 'react-navigation';
import type { EventData as PassedEventData } from 'components/ActivityFeed/ActivityFeedItem';
import type { Stream } from 'models/Sablier';

import type { ReferralRewardsIssuersAddresses } from 'reducers/referralsReducer';
import type { PoolPrizeInfo } from 'models/PoolTogether';


type Props = {
  theme: Theme,
  navigation: NavigationScreenProp<*>,
  event: Object,
  isVisible: boolean,
  onClose: (?(() => void)) => void,
  rates: Rates,
  baseFiatCurrency: ?string,
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
  goToInvitationFlow: () => void,
  isPPNActivated: boolean,
  updateTransactionStatus: (hash: string) => void,
  lookupAddress: (address: string) => void,
  itemData: PassedEventData,
  isForAllAccounts?: boolean,
  storybook?: boolean,
  history: TransactionsStore,
  referralRewardIssuersAddresses: ReferralRewardsIssuersAddresses,
  isPillarRewardCampaignActive: boolean,
  collectiblesHistory: CollectibleTrx[],
  updateCollectibleTransaction: (hash: string) => void,
  updatingTransaction: string,
  updatingCollectibleTransaction: string,
  isSmartAccount: boolean,
  depositedAssets: DepositedAsset[],
  poolStats: PoolPrizeInfo,
  keyBasedWalletAddress: string,
  incomingStreams: Stream[],
  outgoingStreams: Stream[],
};

type State = {
  SWActivationModalVisible: boolean,
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
  collectibleUrl?: ?string,
  isFailed?: boolean;
  errorMessage?: string,
  sublabel?: string,
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
  border-radius: ${({ borderRadius }) => borderRadius || 64}px;
`;

const StyledCollectibleImage = styled(CollectibleImage)`
  width: 64px;
  height: 64px;
  border-radius: 64px;
`;

const IconCircle = styled.View`
  width: 64px;
  height: 64px;
  border-radius: ${({ borderRadius }) => borderRadius || 32}px;
  background-color: ${props => props.backgroundColor || themedColors.tertiary};
  align-items: center;
  justify-content: center;
  text-align: center;
  ${({ border, theme }) => border && `
    border-color: ${theme.colors.border};
    border-width: 1px;
  `}
  overflow: hidden;
`;

const ItemIcon = styled(Icon)`
  font-size: 64px;
  color: ${({ iconColor, theme }) => iconColor || theme.colors.primary};
`;

const ActionIcon = styled(Icon)`
  margin-left: 4px;
  color: ${({ iconColor, theme }) => iconColor || theme.colors.secondaryText};
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

const EventTimeHolder = styled.View`
  text-align: center;
  padding: 0 8px;
`;

const AvatarWrapper = styled.TouchableOpacity`
  align-items: center;
`;

const ErrorMessage = styled(BaseText)`
  color: ${themedColors.negative};
  margin-bottom: ${spacing.large}px;
  width: 100%;
  text-align: center;
`;

const PoolTogetherTicketsWrapper = styled.View`
  align-items: center;
`;

const CornerIcon = styled(CachedImage)`
  width: 22px;
  height: 22px;
  position: absolute;
  top: 0;
  right: 0;
`;

export class EventDetail extends React.Component<Props, State> {
  timer: ?IntervalID;
  timeout: ?TimeoutID;

  state = {
    SWActivationModalVisible: false,
  };

  componentDidMount() {
    const { event } = this.props;
    const { type } = event;
    if (!(type === TRANSACTION_EVENT || type === COLLECTIBLE_TRANSACTION)) return;
    const txInfo = this.findTxInfo(event.type === COLLECTIBLE_TRANSACTION);
    if (!txInfo) return;
    this.syncEnsRegistry(txInfo);
    this.syncTxStatus(txInfo);
  }

  componentDidUpdate(prevProps: Props) {
    const { event, isVisible } = this.props;
    const { type } = event;
    if (!(type === TRANSACTION_EVENT || type === COLLECTIBLE_TRANSACTION)) return;
    const txInfo = this.findTxInfo(event.type === COLLECTIBLE_TRANSACTION);
    const trxStatus = txInfo?.status;
    if (!prevProps.isVisible && isVisible) {
      if (txInfo) {
        this.syncEnsRegistry(txInfo);
        this.syncTxStatus(txInfo);
      }
    }
    if (prevProps.isVisible && !isVisible) {
      this.cleanup();
    }
    if (trxStatus !== TX_PENDING_STATUS && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  componentWillUnmount() {
    this.cleanup();
  }

  cleanup() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  findTxInfo = (isCollectible?: boolean) => {
    const { collectiblesHistory, history, event } = this.props;

    if (isCollectible) {
      return collectiblesHistory.find(({ hash }) => hash === event.hash);
    }

    return findTransactionAcrossAccounts(history, event.hash);
  };

  syncEnsRegistry = (txInfo: Transaction | CollectibleTrx) => {
    const { ensRegistry, lookupAddress } = this.props;
    const relatedAddress = this.getRelevantAddress(txInfo);

    if (!ensRegistry[relatedAddress]) {
      lookupAddress(relatedAddress);
    }
  };

  syncTxStatus = (txInfo: Transaction | CollectibleTrx) => {
    if (txInfo.status === TX_PENDING_STATUS) {
      const { isSmartAccount } = this.props;
      this.timeout = setTimeout(this.updateTransaction, 500);
      if (!isSmartAccount) {
        this.timer = setInterval(this.updateTransaction, 10000);
      }
    }

    if (txInfo.status === TX_CONFIRMED_STATUS && (!txInfo.gasUsed || !txInfo.gasPrice)) {
      this.updateTransaction();
    }
  };

  updateTransaction = () => {
    const { event, updateCollectibleTransaction, updateTransactionStatus } = this.props;
    const { type, hash } = event;
    if (type === COLLECTIBLE_TRANSACTION) {
      updateCollectibleTransaction(hash);
    } else {
      updateTransactionStatus(hash);
    }
  };

  getRelevantAddress = (event: Object): string => {
    const { itemData } = this.props;
    const { isReceived } = itemData;
    return isReceived ? event.from : event.to;
  };

  getFormattedGasFee = (formattedFee: number, token: string) => {
    const { baseFiatCurrency, rates } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const rate = getRate(rates, token, fiatCurrency);
    const formattedFiatValue = formatFiat(formattedFee * rate, fiatCurrency);
    return t('label.feeTokenFiat', {
      tokenValue: t('tokenValue', { value: formattedFee, token }), fiatValue: formattedFiatValue,
    });
  };

  getFeeLabel = (event: Object) => {
    const { gasUsed, gasPrice, feeWithGasToken } = event;

    if (!isEmpty(feeWithGasToken)) {
      return t('label.feeToken', {
        tokenValue: formatTransactionFee(feeWithGasToken.feeInWei, get(feeWithGasToken, 'gasToken')),
      });
    }

    if (gasUsed) {
      const fee = gasUsed && gasPrice ? Math.round(gasUsed * gasPrice) : 0;
      const formattedFee = parseFloat(utils.formatEther(fee.toString()));
      return this.getFormattedGasFee(formattedFee, ETH);
    }
    return null;
  };

  sendTokensToAddress = (address: string) => {
    const { ensRegistry } = this.props;
    this.props.navigation.navigate(SEND_TOKEN_FROM_CONTACT_FLOW, {
      contact: {
        ethAddress: address,
        name: address,
        ensName: ensRegistry[address],
      },
    });
    this.props.onClose();
  };

  viewOnTheBlockchain = () => {
    const { hash } = this.props.event;
    const url = getEnv().TX_DETAILS_URL + hash;
    Linking.openURL(url);
  };

  viewBadge = () => {
    const { navigation, event, onClose } = this.props;
    const { badgeId } = event;
    onClose();
    navigation.navigate(BADGE, { badgeId });
  };

  showReceiveModal = (receiveWalletAddress: string) => {
    this.props.onClose(() =>
      Modal.open(() => <ReceiveModal address={receiveWalletAddress} />),
    );
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

  topUpPillarNetwork = () => {
    const { onClose, navigation } = this.props;
    onClose();
    navigation.navigate(TANK_FUND_FLOW);
  };

  onAaveViewDeposit = (depositedAsset: ?DepositedAsset) => {
    const { onClose, navigation } = this.props;
    onClose();
    navigation.navigate(LENDING_VIEW_DEPOSITED_ASSET, { depositedAsset });
  };

  onAaveDepositMore = () => {
    const { onClose, navigation, event } = this.props;
    onClose();
    navigation.navigate(LENDING_ENTER_DEPOSIT_AMOUNT, { symbol: event?.extra?.symbol });
  };

  onAaveWithdrawMore = () => {
    const { onClose, navigation, event } = this.props;
    onClose();
    navigation.navigate(LENDING_ENTER_WITHDRAW_AMOUNT, { symbol: event?.extra?.symbol });
  };

  PPNWithdraw = () => {
    const { onClose, navigation } = this.props;
    onClose();
    navigation.navigate(TANK_WITHDRAWAL_FLOW);
  };

  send = () => {
    const { onClose, navigation } = this.props;
    onClose();
    navigation.navigate(SEND_TOKEN_FROM_HOME_FLOW);
  };

  sendSynthetic = (relatedAddress: string) => {
    const { onClose, navigation, ensRegistry } = this.props;
    onClose();
    const contactFromAddress = relatedAddress
      && { ethAddress: relatedAddress, username: ensRegistry[relatedAddress] || relatedAddress };
    const contact = contactFromAddress;
    navigation.navigate(SEND_SYNTHETIC_AMOUNT, { contact });
  };

  settle = () => {
    const { onClose, navigation } = this.props;
    onClose();
    navigation.navigate(SETTLE_BALANCE);
  };

  goToPoolTogetherPurcharse = (symbol: string) => {
    const { onClose, navigation, poolStats = {} } = this.props;
    const { totalPoolTicketsCount, userInfo } = poolStats[symbol];

    let userTickets = 0;
    if (userInfo) {
      userTickets = Math.floor(parseFloat(userInfo.ticketBalance));
    }

    onClose();

    navigation.navigate(POOLTOGETHER_PURCHASE, {
      poolToken: symbol,
      poolTicketsCount: 0,
      totalPoolTicketsCount,
      userTickets,
    });
  };

  goToPoolTogetherWithdraw = (symbol: string) => {
    const { onClose, navigation, poolStats = {} } = this.props;
    const { totalPoolTicketsCount, userInfo } = poolStats[symbol];

    let userTickets = 0;
    if (userInfo) {
      userTickets = Math.floor(parseFloat(userInfo.ticketBalance));
    }

    onClose();

    navigation.navigate(POOLTOGETHER_WITHDRAW, {
      poolToken: symbol,
      poolTicketsCount: 0,
      totalPoolTicketsCount,
      userTickets,
    });
  };

  goToPoolTogetherPool = (symbol: string) => {
    const { onClose, navigation } = this.props;
    onClose();
    navigation.navigate(POOLTOGETHER_DASHBOARD, { symbol });
  };

  goToIncomingStream = (streamId: string) => {
    const { onClose, navigation, incomingStreams } = this.props;
    onClose();
    const stream = incomingStreams.find(({ id }) => id === streamId);
    navigation.navigate(SABLIER_INCOMING_STREAM, { stream });
  }

  goToOutgoingStream = (streamId: string) => {
    const { onClose, navigation, outgoingStreams } = this.props;
    onClose();
    const stream = outgoingStreams.find(({ id }) => id === streamId);
    navigation.navigate(SABLIER_OUTGOING_STREAM, { stream });
  }

  goToStreamWithdraw = (streamId: string) => {
    const { onClose, navigation, incomingStreams } = this.props;
    onClose();
    const stream = incomingStreams.find(({ id }) => id === streamId);
    navigation.navigate(SABLIER_WITHDRAW, { stream });
  }

  getReferButtonTitle = () => {
    const { isPillarRewardCampaignActive } = this.props;
    if (isPillarRewardCampaignActive) return t('button.referFriends');
    return t('button.inviteFriends');
  };

  renderPoolTogetherTickets = (event: Object) => {
    const { symbol, amount, decimals } = event.extra;
    const formattedAmount = parseFloat(formatUnits(amount, decimals)).toString();
    const isPositive = event.tag !== POOLTOGETHER_DEPOSIT_TRANSACTION;
    const amountText = getFormattedValue(formattedAmount, symbol, { isPositive, noSymbol: !formattedAmount });
    const ticketsText = `(${t('ticketAmount', { count: formattedAmount })})`;
    // eslint-disable-next-line i18next/no-literal-string
    const amountTextColor = event.tag === POOLTOGETHER_WITHDRAW_TRANSACTION ? 'positive' : 'text';
    const title = event.tag === POOLTOGETHER_DEPOSIT_TRANSACTION ? t('label.purchase') : t('label.withdraw');

    return (
      <PoolTogetherTicketsWrapper>
        <BaseText secondary regular>{title}</BaseText>
        <MediumText large color={this.getColor(amountTextColor)}>{amountText}</MediumText>
        <BaseText secondary medium>{ticketsText}</BaseText>
      </PoolTogetherTicketsWrapper>
    );
  };

  getWalletCreatedEventData = (event: Object): ?EventData => {
    const { isSmartWalletActivated } = this.props;
    switch (event.eventTitle) {
      case 'Wallet created':
        return {
          buttons: [
            {
              title: this.getReferButtonTitle(),
              onPress: this.referFriends,
              squarePrimary: true,
            },
          ],
        };
      case 'Smart Wallet created':
        const activateButton = {
          title: t('button.activate'),
          onPress: this.activateSW,
        };

        const topUpButton = {
          title: t('button.topUp'),
          onPress: this.topUpSW,
          secondary: true,
        };

        return {
          buttons: isSmartWalletActivated ? [topUpButton] : [activateButton],
        };
      case 'Wallet imported':
        return {
          primaryButtonTitle: this.getReferButtonTitle(),
          buttons: [
            {
              title: this.getReferButtonTitle(),
              onPress: this.referFriends,
              squarePrimary: true,
            },
          ],
        };
      default:
        return null;
    }
  };

  getUserEventData = (event: Object): ?EventData => {
    const { isPPNActivated, isSmartWalletActivated } = this.props;

    switch (event.subType) {
      case WALLET_CREATE_EVENT:
        return this.getWalletCreatedEventData(event);
      case PPN_INIT_EVENT:
        if (isPPNActivated) {
          return {
            actionTitle: t('label.activated'),
            buttons: [
              {
                title: t('button.send'),
                onPress: this.sendSynthetic,
                secondary: true,
              },
              {
                title: t('button.topUp'),
                onPress: this.topUpPillarNetwork,
                squarePrimary: true,
              },
            ],
          };
        }
        if (!isSmartWalletActivated) {
          return {
            actionTitle: t('label.created'),
            buttons: [
              {
                title: t('button.activate'),
                onPress: this.activateSW,
              },
            ],
          };
        }
        return {
          actionTitle: t('label.created'),
          buttons: [
            {
              title: t('button.topUp'),
              onPress: this.topUpPillarNetwork,
            },
          ],
        };

      case WALLET_BACKUP_EVENT:
        return {
          buttons: [
            {
              title: this.getReferButtonTitle(),
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
      isPPNActivated,
      itemData,
      referralRewardIssuersAddresses,
      depositedAssets,
      isSmartAccount,
      keyBasedWalletAddress,
      ensRegistry,
    } = this.props;

    const value = formatUnits(event.value, assetDecimals);
    const relevantAddress = this.getRelevantAddress(event);
    const { fullItemValue, isReceived } = itemData;
    const formattedValue = formatAmount(value);

    const isPending = isPendingTransaction(event);
    const isFailed = isFailedTransaction(event);
    const isTimedOut = isTimedOutTransaction(event);

    let eventData: ?EventData = null;

    let aaveDepositedAsset;
    if (isAaveTransactionTag(event?.tag)) {
      aaveDepositedAsset = depositedAssets.find(({
        symbol: depositedAssetSymbol,
      }) => depositedAssetSymbol === event?.extra?.symbol);
    }

    switch (event.tag) {
      case PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT:
        const activatePillarNetworkButton = {
          title: t('button.activatePPN'),
          onPress: this.topUpPillarNetwork,
          secondary: true,
        };

        const referFriendsButton = {
          title: this.getReferButtonTitle(),
          onPress: this.referFriends,
          secondary: true,
        };

        const referFriendsButtonSecondary = {
          title: this.getReferButtonTitle(),
          onPress: this.referFriends,
          squarePrimary: true,
        };

        eventData = {
          actionTitle: t('label.activated'),
          actionSubtitle: this.getFeeLabel(event),
          buttons: isPPNActivated ? [referFriendsButton] : [activatePillarNetworkButton, referFriendsButtonSecondary],
        };
        break;
      case PAYMENT_NETWORK_ACCOUNT_TOPUP:
        const topUpMoreButton = {
          title: t('button.topUpMore'),
          onPress: this.topUpPillarNetwork,
          squarePrimary: true,
        };
        eventData = {
          buttons: isPending
            ? [topUpMoreButton]
            : [
              {
                title: t('button.send'),
                onPress: this.sendSynthetic,
                secondary: true,
              },
              topUpMoreButton,
            ],
        };
        break;
      case SET_SMART_WALLET_ACCOUNT_ENS:
        eventData = {
          name: t('ensName'),
          actionTitle: t('label.registered'),
          actionSubtitle: event.extra.ensName,
        };
        break;
      case PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL:
        eventData = {
          buttons: [
            {
              title: t('button.withdrawMore'),
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
              title: t('button.settleMore'),
              onPress: this.settle,
              secondary: true,
            },
          ],
        };
        break;
      case SMART_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER:
        eventData = {
          name: t('label.smartWalletGasRelayerPLR'),
          actionTitle: isPending ? t('label.enabling') : t('label.enabled'),
        };
        break;
      case SMART_WALLET_ACCOUNT_DEVICE_ADDED:
        eventData = {
          name: t('label.newSmartWalletAccountDevice'),
          actionTitle: isPending ? t('label.adding') : t('label.added'),
        };
        break;
      case SMART_WALLET_ACCOUNT_DEVICE_REMOVED:
        eventData = {
          name: t('label.smartWalletAccountDevice'),
          actionTitle: isPending ? t('label.removing') : t('label.removed'),
        };
        break;
      case AAVE_LENDING_DEPOSIT_TRANSACTION:
        eventData = {
          name: t('aaveDeposit'),
          actionTitle: fullItemValue,
        };
        const aaveDepositButtons = [];
        if (event?.asset) {
          aaveDepositButtons.push({
            title: t('button.depositMore'),
            onPress: this.onAaveDepositMore,
            secondary: true,
          });
          if (aaveDepositedAsset) {
            aaveDepositButtons.push({
              title: t('button.viewDeposit'),
              onPress: () => this.onAaveViewDeposit(aaveDepositedAsset),
              squarePrimary: true,
            });
          }
        }
        eventData.buttons = aaveDepositButtons;
        break;
      case AAVE_LENDING_WITHDRAW_TRANSACTION:
        eventData = {
          name: t('aaveDeposit'),
          actionTitle: fullItemValue,
        };
        const aaveWithdrawButtons = [];
        if (event?.asset && aaveDepositedAsset) {
          if (aaveDepositedAsset?.currentBalance > 0) {
            aaveWithdrawButtons.push({
              title: t('button.withdrawMore'),
              onPress: this.onAaveWithdrawMore,
              secondary: true,
            });
          }
          aaveWithdrawButtons.push({
            title: t('button.viewDeposit'),
            onPress: () => this.onAaveViewDeposit(aaveDepositedAsset),
            squarePrimary: true,
          });
        }
        eventData.buttons = aaveWithdrawButtons;
        break;
      case POOLTOGETHER_DEPOSIT_TRANSACTION:
      case POOLTOGETHER_WITHDRAW_TRANSACTION: {
        const buttons = [];
        if (isSmartAccount) {
          const { extra: { symbol } } = event;
          if (event.tag === POOLTOGETHER_DEPOSIT_TRANSACTION) {
            buttons.push({
              title: t('button.purchaseMore'),
              onPress: () => this.goToPoolTogetherPurcharse(symbol),
              secondary: true,
            });
          } else {
            buttons.push({
              title: t('button.withdrawMore'),
              onPress: () => this.goToPoolTogetherWithdraw(symbol),
              secondary: true,
            });
          }
          buttons.push(
            {
              title: t('button.viewPoolTogetherPool'),
              onPress: () => this.goToPoolTogetherPool(symbol),
              squarePrimary: true,
            },
          );
        }
        eventData = {
          name: t('poolTogether'),
          customActionTitle: this.renderPoolTogetherTickets(event),
          buttons,
        };
        break;
      }
      case SABLIER_CREATE_STREAM: {
        const { contactAddress, streamId } = event.extra;
        const usernameOrAddress = findEnsNameCaseInsensitive(ensRegistry, contactAddress) || contactAddress;
        eventData = {
          name: usernameOrAddress,
          sublabel: t('label.outgoingSablierStream'),
          actionSubtitle: t('label.started'),
          fee: this.getFeeLabel(event),
          buttons: [
            {
              title: t('button.viewSablierStream'),
              secondary: true,
              onPress: () => this.goToOutgoingStream(streamId),
            },
          ],
        };
        break;
      }
      case SABLIER_WITHDRAW: {
        const { incomingStreams, supportedAssets } = this.props;
        const { contactAddress, assetAddress, streamId } = event.extra;
        const usernameOrAddress = findEnsNameCaseInsensitive(ensRegistry, contactAddress) || contactAddress;
        const assetData = getAssetDataByAddress([], supportedAssets, assetAddress);
        const { symbol, decimals } = assetData;

        const stream = incomingStreams.find(({ id }) => id === streamId);
        const formattedStreamAmount = formatAmount(formatUnits(stream?.deposit, decimals), getDecimalPlaces(symbol));

        eventData = {
          name: usernameOrAddress,
          sublabel: t('label.withdraw'),
          fee: this.getFeeLabel(event),
          actionSubtitle: t('sablierContent.label.ofTokenValueStream', { value: formattedStreamAmount, token: symbol }),
          buttons: [
            {
              title: t('button.withdrawMore'),
              secondary: true,
              onPress: () => this.goToStreamWithdraw(streamId),
            },
            {
              title: t('button.viewSablierStream'),
              squarePrimary: true,
              onPress: () => this.goToIncomingStream(streamId),
            },
          ],
        };
        break;
      }
      case SABLIER_CANCEL_STREAM:
        return null;
      default:
        const isPPNTransaction = get(event, 'isPPNTransaction', false);
        const isTrxBetweenSWAccount = isSWAddress(event.from, accounts) && isSWAddress(event.to, accounts);

        const isReferralRewardTransaction = referralRewardIssuersAddresses.includes(relevantAddress) && isReceived;
        const actionSubtitle = isReceived ? t('label.toPPN') : t('label.fromPPN');
        const isZeroValue = formattedValue === '0';

        if (isPPNTransaction) {
          eventData = {
            customActionTitle: !isTrxBetweenSWAccount && (
              <TankAssetBalance
                amount={
                  getFormattedValue(formattedValue, event.asset, { isPositive: !!isReceived, noSymbol: isZeroValue })
                }
                textStyle={{ fontSize: fontSizes.large }}
                iconStyle={{ height: 14, width: 8, marginRight: 9 }}
              />
            ),
            actionSubtitle: !isTrxBetweenSWAccount ? actionSubtitle : '',
          };

          if (isReceived) {
            if (isTrxBetweenSWAccount) {
              eventData.buttons = [];
            } else {
              eventData.buttons = [
                {
                  title: t('button.sendBack'),
                  onPress: () => this.sendSynthetic(relevantAddress),
                  squarePrimary: true,
                },
              ];
            }
          } else {
            eventData.buttons = [
              {
                title: t('button.sendMore'),
                onPress: () => this.sendSynthetic(relevantAddress),
                secondary: true,
              },
            ];
          }
        } else if (isPoolTogetherAddress(event.to)) {
          const buttons = [{
            title: t('button.viewPoolTogetherPool'),
            onPress: () => this.goToPoolTogetherPool(DAI),
            squarePrimary: true,
          }];
          eventData = {
            name: t('poolTogether'),
            buttons,
          };
        } else {
          eventData = {
            actionTitle: fullItemValue,
          };

          let buttons = [];
          const isFromKWToSW = addressesEqual(event.from, keyBasedWalletAddress) && isSWAddress(event.to, accounts);

          const inviteToPillarButton = {
            title: t('button.inviteToPillar'),
            onPress: this.referFriends,
            squarePrimary: true,
          };

          const sendBackToAddress = {
            title: t('button.sendBack'),
            onPress: () => this.sendTokensToAddress(relevantAddress),
            secondary: true,
          };

          const sendMoreToAddress = {
            title: t('button.sendMore'),
            onPress: () => this.sendTokensToAddress(relevantAddress),
            secondary: true,
          };

          const sendFromSW = {
            title: t('button.send'),
            onPress: () => this.send(),
            secondary: true,
          };

          if (isReferralRewardTransaction) {
            buttons = [];
          } else if (isReceived) {
            if (isFromKWToSW) {
              buttons = [sendFromSW];
            } else if (isPending) {
              buttons = [inviteToPillarButton];
            } else {
              buttons = [sendBackToAddress, inviteToPillarButton];
            }
          } else if (isPending) {
            buttons = [inviteToPillarButton];
          } else {
            buttons = [sendMoreToAddress, inviteToPillarButton];
          }
          eventData.buttons = buttons;
          if (!isReceived) {
            eventData.fee = this.getFeeLabel(event);
          }
        }
    }
    if (isPending) {
      eventData.actionIcon = 'pending'; // eslint-disable-line i18next/no-literal-string
    }
    if (isFailed || isTimedOut) {
      eventData.isFailed = true;
      eventData.errorMessage = isFailed
        ? t('error.transactionFailed.default')
        : t('error.transactionFailed.timeOut');
      eventData.actionIcon = 'failed'; // eslint-disable-line i18next/no-literal-string
    }

    return eventData;
  };

  getCollectibleTransactionEventData = (event: Object): EventData => {
    const { itemData } = this.props;
    const { subtext, isReceived } = itemData;

    const isPending = isPendingTransaction(event);

    let eventData: EventData = {
      actionSubtitle: subtext,
    };

    if (isReceived) {
      eventData = {
        ...eventData,
        actionTitle: isPending ? t('label.receiving') : t('label.received'),
      };
    } else {
      eventData = {
        ...eventData,
        actionTitle: isPending ? t('label.sending') : t('label.sent'),
      };

      if (!isPending) {
        eventData.fee = this.getFeeLabel(event);
      }
    }

    if (isPending) {
      eventData.actionIcon = 'pending'; // eslint-disable-line i18next/no-literal-string
    }

    return eventData;
  };

  getBadgeRewardEventData = (event: Object): EventData => {
    const { name, imageUrl } = event;
    const isPending = isPendingTransaction(event);

    return {
      name,
      imageUrl,
      actionTitle: isPending ? t('label.receiving') : t('label.received'),
      actionSubtitle: t('label.badge'),
      actionIcon: isPending ? 'pending' : null, // eslint-disable-line i18next/no-literal-string
      buttons: [{
        title: t('button.viewBadge'),
        onPress: this.viewBadge,
        secondary: true,
      }],
    };
  };

  getEventData = (event: Object): ?EventData => {
    let eventData = null;
    switch (event.type) {
      case USER_EVENT:
        eventData = this.getUserEventData(event);
        break;
      case TRANSACTION_EVENT:
      case TRANSACTION_PENDING_EVENT:
        eventData = this.getTransactionEventData(event);
        break;
      case COLLECTIBLE_TRANSACTION:
        eventData = this.getCollectibleTransactionEventData(event);
        break;
      case BADGE_REWARD_EVENT:
        eventData = this.getBadgeRewardEventData(event);
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
      itemImageUrl,
      itemImageSource,
      iconName,
      iconColor,
      iconBackgroundColor,
      iconBorder,
      collectibleUrl,
      itemImageRoundedSquare,
      cornerIcon,
      label,
      profileImage,
    } = itemData;
    const borderRadius = itemImageRoundedSquare && 13;

    const { genericToken: fallbackSource } = images(theme);
    if (itemImageUrl) {
      return (
        <IconCircle
          borderRadius={borderRadius}
          border={iconBorder}
          backgroundColor={this.getColor(iconBackgroundColor)}
        >
          <TokenImage source={{ uri: itemImageUrl }} fallbackSource={fallbackSource} />
        </IconCircle>
      );
    }
    if (itemImageSource) {
      return (
        <View>
          <TokenImage style={{ borderRadius }} source={itemImageSource} />
          {cornerIcon && <CornerIcon source={cornerIcon} />}
        </View>
      );
    }
    if (iconName) {
      return (
        <IconCircle borderRadius={borderRadius}>
          <ItemIcon
            borderRadius={borderRadius}
            name={iconName}
            iconColor={this.getColor(iconColor)}
          />
        </IconCircle>
      );
    }

    if (collectibleUrl) {
      return (
        <IconCircle borderRadius={borderRadius} border backgroundColor={this.getColor('card')}>
          <StyledCollectibleImage
            borderRadius={borderRadius}
            source={{ uri: collectibleUrl }}
            fallbackSource={fallbackSource}
          />
        </IconCircle>
      );
    }

    if (profileImage) {
      return (
        <ProfileImage
          userName={label}
          diameter={64}
          textStyle={{ fontSize: fontSizes.big }}
          noShadow
          borderWidth={0}
          cornerIcon={cornerIcon}
          cornerIconSize={22}
        />
      );
    }

    return null;
  };

  getColor = (color: ?string): ?string => {
    if (!color) return null;
    const { theme } = this.props;
    const colors = getThemeColors(theme);
    return colors[color] || color;
  };

  renderSettle = (settleEventData: Object, eventData: EventData) => {
    const { PPNTransactions, isForAllAccounts, mergedPPNTransactions } = this.props;
    const { isFailed, errorMessage } = eventData;
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
        {!!groupedTransactions && groupedTransactions.map(group => {
          const formattedVal = formatUnits(group.value.toString(), 18);
          return (
            <React.Fragment key={group.symbol}>
              <Row marginBottom={10}>
                <BaseText regular synthetic>{t('label.fromPillarTank')}</BaseText>
                <TankAssetBalance
                  amount={getFormattedValue(formattedVal, group.symbol, { isPositive: !isFailed, noSymbol: !isFailed })}
                  textStyle={{ fontSize: fontSizes.big }}
                  iconStyle={{ height: 14, width: 8, marginRight: 9 }}
                  secondary={isFailed}
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
                    <BaseText secondary small>
                      {getFormattedValue(formattedAmount, asset, { isPositive: !isFailed, noSymbol: !isFailed })}
                    </BaseText>
                  </Row>
                );
              })}
            </React.Fragment>
          );
        })}
        {!isFailed &&
        <>
          <Divider />
          <Row>
            <BaseText regular positive>{t('label.toSmartWallet')}</BaseText>
            <View>
              {groupedTransactions.map(({ value, symbol }) => (
                <BaseText positive large key={symbol}>
                  {t('positiveTokenValue', { value: formatUnits(value.toString(), 18), token: symbol })}
                </BaseText>
              ))}
            </View>
          </Row>
        </>}
        {!!errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </SettleWrapper>
    );
  };

  renderFee = (hash: string, fee: ?string, isReceived?: boolean) => {
    const { updatingTransaction, updatingCollectibleTransaction } = this.props;
    if (isReceived) return null;
    if (fee) {
      return (<BaseText regular secondary style={{ marginBottom: 32 }}>{fee}</BaseText>);
    } else if (updatingTransaction === hash || updatingCollectibleTransaction === hash) {
      return (<Spinner height={20} width={20} style={{ marginBottom: 32 }} />);
    }
    return null;
  };

  renderContent = (event: Object, eventData: EventData) => {
    const { itemData } = this.props;
    const {
      date, name,
      actionTitle, actionSubtitle, actionIcon, customActionTitle,
      buttons = [], settleEventData, fee,
      errorMessage,
      sublabel,
    } = eventData;

    const {
      label: itemLabel,
      actionLabel,
      fullItemValue,
      subtext,
      valueColor,
      isReceived,
      statusIconColor,
    } = itemData;

    const title = actionTitle || actionLabel || fullItemValue;
    const label = name || itemLabel;
    const subtitle = (actionSubtitle || fullItemValue) ? actionSubtitle || subtext : null;
    const titleColor = this.getColor(valueColor);
    const eventTime = date && formatDate(new Date(date * 1000), 'MMMM D, YYYY HH:mm');

    return (
      <Wrapper forceInset={{ top: 'never', bottom: 'always' }}>
        <EventTimeHolder>
          <BaseText tiny secondary>{eventTime}</BaseText>
        </EventTimeHolder>
        <Spacing h={10} />
        <AvatarWrapper disabled>
          <BaseText medium>{label}</BaseText>
          {sublabel && <BaseText regular secondary>{sublabel}</BaseText>}
          <Spacing h={20} />
          {this.renderImage(itemData)}
        </AvatarWrapper>
        <Spacing h={20} />
        {settleEventData ? this.renderSettle(settleEventData, eventData) : (
          <React.Fragment>
            <ActionWrapper>
              {!!title && <MediumText large color={titleColor}>{title}</MediumText>}
              {customActionTitle}
              {!!actionIcon && <ActionIcon name={actionIcon} iconColor={statusIconColor} />}
            </ActionWrapper>
            {subtitle ? (
              <React.Fragment>
                <Spacing h={4} />
                <BaseText regular secondary>{subtitle}</BaseText>
                <Spacing h={16} />
              </React.Fragment>
            ) : (
              <Spacing h={32} />
            )}
            {!!errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
            {this.renderFee(event.hash, fee, isReceived)}
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
    const { SWActivationModalVisible } = this.state;

    let { event } = this.props;

    if (event.type === TRANSACTION_EVENT || event.type === COLLECTIBLE_TRANSACTION) {
      const txInfo = this.findTxInfo(event.type === COLLECTIBLE_TRANSACTION) || {};
      event = { ...event, ...txInfo, type: event.type };
    }

    let eventData = this.getEventData(event);

    if (!eventData) return null;
    const { hash, isPPNTransaction } = event;
    const allowViewOnBlockchain = !!hash && !isPPNTransaction;

    if (allowViewOnBlockchain) {
      const currentModalButtons = eventData?.buttons || [];
      const hasModalButtons = !isEmpty(currentModalButtons);
      const viewOnBlockchainButtonTitle = t('button.viewOnBlockchain');
      const alreadyHasViewOnBlockchainButton = hasModalButtons
        && currentModalButtons.some(({ title }) => title === viewOnBlockchainButtonTitle);

      if (!alreadyHasViewOnBlockchainButton) {
        const viewOnBlockchainButton = {
          squarePrimary: hasModalButtons, // styling if multiple buttons in modal
          secondary: !hasModalButtons, // styling if single button in modal
          title: viewOnBlockchainButtonTitle,
          onPress: this.viewOnTheBlockchain,
        };

        /**
         * per design request there SHOULD be only be 2 buttons
         * and LAST (second) should always be changed to blockchain button,
         * however, not cutting all buttons and just replacing last
         * assuming that there can only be 2
         */
        const updatedModalButtons = currentModalButtons.length > 1
          ? currentModalButtons.slice(0, -1).concat(viewOnBlockchainButton)
          : currentModalButtons.concat(viewOnBlockchainButton);

        eventData = {
          ...eventData,
          buttons: updatedModalButtons,
        };
      }
    }

    if (storybook) {
      return this.renderContent(event, eventData);
    }

    return (
      <React.Fragment>
        <SlideModal
          isVisible={isVisible}
          onModalHide={onClose}
          noClose
          hideHeader
        >
          {this.renderContent(event, eventData)}
        </SlideModal>
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
  user: { data: user },
  accounts: { data: accounts },
  ensRegistry: { data: ensRegistry },
  assets: { supportedAssets },
  history: { data: history, updatingTransaction },
  referrals: { referralRewardIssuersAddresses, isPillarRewardCampaignActive },
  collectibles: { updatingTransaction: updatingCollectibleTransaction },
  lending: { depositedAssets },
  poolTogether: { poolStats },
  wallet: { data: { address: keyBasedWalletAddress } },
  sablier: { incomingStreams, outgoingStreams },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  user,
  accounts,
  ensRegistry,
  supportedAssets,
  history,
  referralRewardIssuersAddresses,
  isPillarRewardCampaignActive,
  updatingTransaction,
  updatingCollectibleTransaction,
  depositedAssets,
  poolStats,
  keyBasedWalletAddress,
  incomingStreams,
  outgoingStreams,
});

const structuredSelector = createStructuredSelector({
  PPNTransactions: PPNTransactionsSelector,
  mergedPPNTransactions: combinedPPNTransactionsSelector,
  isSmartWalletActivated: isSmartWalletActivatedSelector,
  assetDecimals: assetDecimalsSelector((_, props) => props.event.asset),
  activeAccountAddress: activeAccountAddressSelector,
  accountAssets: accountAssetsSelector,
  activeBlockchainNetwork: activeBlockchainSelector,
  isPPNActivated: isPPNActivatedSelector,
  collectiblesHistory: combinedCollectiblesHistorySelector,
  isSmartAccount: isActiveAccountSmartWalletSelector,
});

const combinedMapStateToProps = (state: RootReducerState, props: Props): $Shape<Props> => ({
  ...structuredSelector(state, props),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  goToInvitationFlow: () => dispatch(goToInvitationFlowAction()),
  updateTransactionStatus: (hash) => dispatch(updateTransactionStatusAction(hash)),
  updateCollectibleTransaction: (hash) => dispatch(updateCollectibleTransactionAction(hash)),
  lookupAddress: (address) => dispatch(lookupAddressAction(address)),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(EventDetail));
