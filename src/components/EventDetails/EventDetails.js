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
import { View, Linking, InteractionManager } from 'react-native';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import styled, { withTheme } from 'styled-components/native';
import { format as formatDate } from 'date-fns';
import { utils, BigNumber as EthersBigNumber } from 'ethers';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';

// components
import { BaseText, MediumText } from 'components/Typography';
import Icon from 'components/Icon';
import Image from 'components/Image';
import TankAssetBalance from 'components/TankAssetBalance';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import SWActivationModal from 'components/SWActivationModal';
import CollectibleImage from 'components/CollectibleImage';
import ProfileImage from 'components/ProfileImage';
import Toast from 'components/Toast';
import Modal from 'components/Modal';
import DetailModal, { DetailRow, DetailParagraph, FEE_PENDING } from 'components/DetailModal';
import { Spacing } from 'components/Layout';

// utils
import { spacing, fontSizes } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import { getRate, getAssetDataByAddress } from 'utils/assets';
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
  isFailedTransaction,
  isTimedOutTransaction,
  isArchanovaAccountAddress,
} from 'utils/feedData';
import { images } from 'utils/images';
import {
  findCollectibleTransactionAcrossAccounts,
  findTransactionAcrossAccounts,
} from 'utils/history';
import { isAaveTransactionTag } from 'utils/aave';
import { isPoolTogetherAddress } from 'utils/poolTogether';
import { getFormattedValue } from 'utils/strings';
import {
  findAccountByAddress,
  getActiveAccount,
  getActiveAccountAddress,
  isArchanovaAccount,
  isEtherspotAccount,
} from 'utils/accounts';

// services
import archanovaService from 'services/archanova';
import etherspotService from 'services/etherspot';

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
  SET_ARCHANOVA_WALLET_ACCOUNT_ENS,
  ARCHANOVA_WALLET_ACCOUNT_DEVICE_ADDED,
  ARCHANOVA_WALLET_ACCOUNT_DEVICE_REMOVED,
  ARCHANOVA_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER,
} from 'constants/archanovaConstants';
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
  RARI_DEPOSIT,
  RARI_CLAIM_RGT,
  LIQUIDITY_POOL_DASHBOARD,
} from 'constants/navigationConstants';
import { AAVE_LENDING_DEPOSIT_TRANSACTION, AAVE_LENDING_WITHDRAW_TRANSACTION } from 'constants/lendingConstants';
import { POOLTOGETHER_DEPOSIT_TRANSACTION, POOLTOGETHER_WITHDRAW_TRANSACTION } from 'constants/poolTogetherConstants';
import {
  SABLIER_CREATE_STREAM,
  SABLIER_WITHDRAW,
  SABLIER_CANCEL_STREAM,
} from 'constants/sablierConstants';
import { WBTC_PENDING_TRANSACTION } from 'constants/exchangeConstants';
import {
  RARI_DEPOSIT_TRANSACTION,
  RARI_WITHDRAW_TRANSACTION,
  RARI_TRANSFER_TRANSACTION,
  RARI_CLAIM_TRANSACTION,
  RARI_TOKENS_DATA,
  RARI_GOVERNANCE_TOKEN_DATA,
} from 'constants/rariConstants';
import {
  LIQUIDITY_POOLS_ADD_LIQUIDITY_TRANSACTION,
  LIQUIDITY_POOLS_REMOVE_LIQUIDITY_TRANSACTION,
  LIQUIDITY_POOLS_STAKE_TRANSACTION,
  LIQUIDITY_POOLS_UNSTAKE_TRANSACTION,
  LIQUIDITY_POOLS_REWARDS_CLAIM_TRANSACTION,
} from 'constants/liquidityPoolsConstants';
import { CHAIN } from 'constants/chainConstants';

// selectors
import {
  PPNTransactionsSelector,
  isPPNActivatedSelector,
  combinedPPNTransactionsSelector,
} from 'selectors/paymentNetwork';
import {
  activeAccountAddressSelector,
  activeBlockchainSelector,
  collectiblesHistorySelector,
} from 'selectors';
import {
  assetDecimalsSelector,
  accountEthereumAssetsSelector,
  ethereumSupportedAssetsSelector,
} from 'selectors/assets';
import { isArchanovaAccountDeployedSelector } from 'selectors/archanova';

// actions
import { lookupAddressAction } from 'actions/ensRegistryActions';
import { updateCollectibleTransactionAction } from 'actions/collectiblesActions';
import { updateTransactionStatusAction } from 'actions/historyActions';

// types
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { AssetsBySymbol, Asset, DepositedAsset } from 'models/Asset';
import type { Theme } from 'models/Theme';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { Account } from 'models/Account';
import type { Transaction } from 'models/Transaction';
import type { CollectibleTransaction, CollectiblesHistoryStore } from 'models/Collectible';
import type { TransactionsGroup } from 'utils/feedData';
import type { NavigationScreenProp } from 'react-navigation';
import type { EventData as PassedEventData } from 'components/ActivityFeed/ActivityFeedItem';
import type { Stream } from 'models/Sablier';
import type { LiquidityPool } from 'models/LiquidityPools';
import type { Selector } from 'selectors';
import type { PoolPrizeInfo } from 'models/PoolTogether';
import type { TransactionsStore } from 'models/History';
import type { RatesPerChain } from 'models/RatesByAssetSymbol';


type StateProps = {|
  ratesPerChain: RatesPerChain,
  baseFiatCurrency: ?string,
  user: Object,
  accounts: Account[],
  ensRegistry: EnsRegistry,
  updatingTransaction: ?string,
  updatingCollectibleTransaction: ?string,
  depositedAssets: DepositedAsset[],
  poolStats: PoolPrizeInfo,
  incomingStreams: Stream[],
  outgoingStreams: Stream[],
  history: TransactionsStore,
|};

type SelectorProps = {|
  PPNTransactions: Transaction[],
  mergedPPNTransactions: Transaction[],
  isArchanovaWalletActivated: boolean,
  assetDecimals: number,
  activeAccountAddress: string,
  accountAssets: AssetsBySymbol,
  activeBlockchainNetwork: string,
  isPPNActivated: boolean,
  collectiblesHistory: CollectiblesHistoryStore,
  supportedAssets: Asset[],
|};

type DispatchProps = {|
  updateTransactionStatus: (hash: string) => void,
  updateCollectibleTransaction: (hash: string) => void,
  lookupAddress: (address: string) => void,
|};

type OwnProps = {|
  navigation: NavigationScreenProp<*>,
  event: Object,
  itemData: PassedEventData,
  isForAllAccounts?: boolean,
|};

type Props = {|
  ...StateProps,
  ...SelectorProps,
  ...DispatchProps,
  ...OwnProps,
  theme: Theme,
|};

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

// returns false for events which wouldn't render a modal
// i.e. getEventData(event) === null
export const shouldShowEventDetails = (event: Object): boolean => {
  switch (event.type) {
    case USER_EVENT:
      return [
        WALLET_CREATE_EVENT,
        PPN_INIT_EVENT,
        WALLET_BACKUP_EVENT,
      ].includes(event.subType);
    case TRANSACTION_EVENT:
    case TRANSACTION_PENDING_EVENT:
      return event.tag !== SABLIER_CANCEL_STREAM;
    case COLLECTIBLE_TRANSACTION:
    case BADGE_REWARD_EVENT:
      return true;
    default:
      return false;
  }
};

const TokenImage = styled(Image)`
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
  background-color: ${({ backgroundColor, theme }) => backgroundColor || theme.colors.basic060};
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
  font-size: ${fontSizes.big};
`;

const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const SettleWrapper = styled.View`
  width: 100%;
  padding: 0 ${spacing.layoutSides}px;
`;

const Divider = styled.View`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.basic060};
`;

const ErrorMessage = styled(BaseText)`
  color: ${({ theme }) => theme.colors.secondaryAccent240};
  margin-bottom: ${spacing.large}px;
  width: 100%;
  text-align: center;
`;

const PoolTogetherTicketsWrapper = styled.View`
  align-items: center;
`;

const CornerIcon = styled(Image)`
  width: 22px;
  height: 22px;
  position: absolute;
  top: 0;
  right: 0;
`;

const ListWrapper = styled.View`
  align-items: center;
`;

export class EventDetail extends React.Component<Props> {
  timer: ?IntervalID;
  timeout: ?TimeoutID;

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      const { type } = this.props.event;
      if (!(type === TRANSACTION_EVENT || type === COLLECTIBLE_TRANSACTION)) return;

      const txInfo = this.findTxInfo(type === COLLECTIBLE_TRANSACTION);
      if (!txInfo) return;

      this.syncEnsRegistry(txInfo);
      this.syncTxStatus(txInfo);
    });
  }

  componentDidUpdate() {
    const { event } = this.props;
    const { type } = event;
    if (!(type === TRANSACTION_EVENT || type === COLLECTIBLE_TRANSACTION)) return;
    const txInfo = this.findTxInfo(event.type === COLLECTIBLE_TRANSACTION);
    const trxStatus = txInfo?.status;
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

    return isCollectible
      ? findCollectibleTransactionAcrossAccounts(collectiblesHistory, event?.hash, event?.batchHash)
      : findTransactionAcrossAccounts(history, event?.hash, event?.batchHash);
  };

  syncEnsRegistry = (txInfo: Transaction | CollectibleTransaction) => {
    const { ensRegistry, lookupAddress } = this.props;
    const relatedAddress = this.getRelevantAddress(txInfo);

    if (!ensRegistry[relatedAddress]) {
      lookupAddress(relatedAddress);
    }
  };

  syncTxStatus = (txInfo: Transaction | CollectibleTransaction) => {
    if (txInfo.status === TX_PENDING_STATUS) {
      this.timeout = setTimeout(this.updateTransaction, 500);
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
    const { baseFiatCurrency, ratesPerChain } = this.props;
    const ethereumRates = ratesPerChain[CHAIN.ETHEREUM] ?? {};
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const rate = getRate(ethereumRates, token, fiatCurrency);
    const formattedFiatValue = formatFiat(formattedFee * rate, fiatCurrency);
    return t('label.feeTokenFiat', {
      tokenValue: t('tokenValue', { value: formattedFee, token }), fiatValue: formattedFiatValue,
    });
  };

  getFeeLabel = (event: Object) => {
    const { gasUsed, gasPrice, feeWithGasToken } = event;

    if (!isEmpty(feeWithGasToken)) {
      return t('label.feeToken', {
        tokenValue: formatTransactionFee(CHAIN.ETHEREUM, feeWithGasToken.feeInWei, feeWithGasToken?.gasToken),
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
  };

  viewOnTheBlockchain = async () => {
    const {
      accounts,
      event: { hash, from, batchHash },
    } = this.props;

    if (!hash && !batchHash) {
      Toast.show({
        message: t('toast.cannotFindTransactionHash'),
        emoji: 'woman-shrugging',
        supportLink: true,
        autoClose: false,
      });
      return;
    }

    const fromAccount = findAccountByAddress(from, accounts);

    // if actual transaction hash is not yet obtained then try to get by batch hash directly
    let explorerLink;
    if (!hash && batchHash && isEtherspotAccount(fromAccount)) {
      explorerLink = await etherspotService.getTransactionExplorerLinkByBatch(CHAIN.ETHEREUM, batchHash);
    } else {
      explorerLink = fromAccount && isArchanovaAccount(fromAccount)
        ? archanovaService.getConnectedAccountTransactionExplorerLink(hash)
        : etherspotService.getTransactionExplorerLink(CHAIN.ETHEREUM, hash);
    }

    if (!explorerLink) {
      Toast.show({
        message: t('toast.cannotGetBlockchainExplorerLink'),
        emoji: 'woman-shrugging',
        supportLink: true,
        autoClose: false,
      });
      return;
    }

    Linking.openURL(explorerLink);
  };

  viewBadge = () => {
    const { navigation, event } = this.props;
    const { badgeId } = event;
    navigation.navigate(BADGE, { badgeId });
  };

  openReceiveModal = (receiveWalletAddress: string) =>
    Modal.open(() => <ReceiveModal address={receiveWalletAddress} />);

  topUpSW = () => {
    const { accounts } = this.props;
    const smartWalletAddress = getActiveAccountAddress(accounts);
    if (!smartWalletAddress) return;
    this.openReceiveModal(smartWalletAddress);
  };

  activateSW = () => {
    Modal.open(() => <SWActivationModal navigation={this.props.navigation} />);
  };

  topUpPillarNetwork = () => {
    const { navigation } = this.props;
    navigation.navigate(TANK_FUND_FLOW);
  };

  onAaveViewDeposit = (depositedAsset: ?DepositedAsset) => {
    const { navigation } = this.props;
    navigation.navigate(LENDING_VIEW_DEPOSITED_ASSET, { depositedAsset });
  };

  onAaveDepositMore = () => {
    const { navigation, event } = this.props;
    navigation.navigate(LENDING_ENTER_DEPOSIT_AMOUNT, { symbol: event?.extra?.symbol });
  };

  onAaveWithdrawMore = () => {
    const { navigation, event } = this.props;
    navigation.navigate(LENDING_ENTER_WITHDRAW_AMOUNT, { symbol: event?.extra?.symbol });
  };

  PPNWithdraw = () => {
    const { navigation } = this.props;
    navigation.navigate(TANK_WITHDRAWAL_FLOW);
  };

  send = () => {
    const { navigation } = this.props;
    navigation.navigate(SEND_TOKEN_FROM_HOME_FLOW);
  };

  sendSynthetic = (relatedAddress: string) => {
    const { navigation, ensRegistry } = this.props;
    const contactFromAddress = relatedAddress
      && { ethAddress: relatedAddress, username: ensRegistry[relatedAddress] || relatedAddress };
    const contact = contactFromAddress;
    navigation.navigate(SEND_SYNTHETIC_AMOUNT, { contact });
  };

  settle = () => {
    const { navigation } = this.props;
    navigation.navigate(SETTLE_BALANCE);
  };

  goToPoolTogetherPurcharse = (symbol: string) => {
    const { navigation, poolStats = {} } = this.props;
    const { totalPoolTicketsCount, userInfo } = poolStats[symbol];

    let userTickets = 0;
    if (userInfo) {
      userTickets = Math.floor(parseFloat(userInfo.ticketBalance));
    }

    navigation.navigate(POOLTOGETHER_PURCHASE, {
      poolToken: symbol,
      poolTicketsCount: 0,
      totalPoolTicketsCount,
      userTickets,
    });
  };

  goToPoolTogetherWithdraw = (symbol: string) => {
    const { navigation, poolStats = {} } = this.props;
    const { totalPoolTicketsCount, userInfo } = poolStats[symbol];

    let userTickets = 0;
    if (userInfo) {
      userTickets = Math.floor(parseFloat(userInfo.ticketBalance));
    }

    navigation.navigate(POOLTOGETHER_WITHDRAW, {
      poolToken: symbol,
      poolTicketsCount: 0,
      totalPoolTicketsCount,
      userTickets,
    });
  };

  goToPoolTogetherPool = (symbol: string) => {
    const { navigation } = this.props;
    navigation.navigate(POOLTOGETHER_DASHBOARD, { symbol });
  };

  goToIncomingStream = (streamId: string) => {
    const { navigation, incomingStreams } = this.props;
    const stream = incomingStreams.find(({ id }) => id === streamId);
    navigation.navigate(SABLIER_INCOMING_STREAM, { stream });
  }

  goToOutgoingStream = (streamId: string) => {
    const { navigation, outgoingStreams } = this.props;
    const stream = outgoingStreams.find(({ id }) => id === streamId);
    navigation.navigate(SABLIER_OUTGOING_STREAM, { stream });
  }

  goToStreamWithdraw = (streamId: string) => {
    const { navigation, incomingStreams } = this.props;
    const stream = incomingStreams.find(({ id }) => id === streamId);
    navigation.navigate(SABLIER_WITHDRAW, { stream });
  }

  goToRariDeposit = () => this.props.navigation.navigate(RARI_DEPOSIT);
  goToRariClaim = () => this.props.navigation.navigate(RARI_CLAIM_RGT);

  goToLiquidityPool = (pool: LiquidityPool) => {
    this.props.navigation.navigate(LIQUIDITY_POOL_DASHBOARD, { pool });
  }

  getLiquidityEventButtons = (buttonTitle: string, pool: LiquidityPool) => {
    return [{
      secondary: true,
      title: buttonTitle,
      onPress: () => this.goToLiquidityPool(pool),
    }];
  }

  renderLiquidityPoolsExchange = (
    topTokens: {name: string, symbol: string}[],
    topTokensAmounts: number[],
    bottomTokens: {name: string, symbol: string }[],
    bottomTokensAmounts: number[],
    options: {
      topTokensSecondary?: boolean,
      bottomTokensSecondary?: boolean
    },
  ) => {
    return (
      <View style={{ width: '100%' }}>
        {topTokens.map((token, index) => (
          <Row key={token.name}>
            <BaseText regular secondary={options.topTokensSecondary}>{token.name}</BaseText>
            <BaseText regular>
              {getFormattedValue(formatAmount(topTokensAmounts[index]), token.symbol, { isPositive: false })}
            </BaseText>
          </Row>
        ))}
        <Spacing h={16} />
        <Divider />
        <Spacing h={16} />
        {bottomTokens.map((token, index) => (
          <Row key={token.name}>
            <BaseText regular secondary={options.bottomTokensSecondary}>{token.name}</BaseText>
            <BaseText fontSize={20} positive>
              {getFormattedValue(formatAmount(bottomTokensAmounts[index]), token.symbol, { isPositive: true })}
            </BaseText>
          </Row>
        ))}
      </View>
    );
  }

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
    const { isArchanovaWalletActivated } = this.props;
    switch (event.eventTitle) {
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
          buttons: isArchanovaWalletActivated ? [topUpButton] : [activateButton],
        };
      default:
        return null;
    }
  };

  getUserEventData = (event: Object): ?EventData => {
    const { isPPNActivated, isArchanovaWalletActivated } = this.props;

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
                transparent: true,
              },
            ],
          };
        }
        if (!isArchanovaWalletActivated) {
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
              secondary: true,
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
      depositedAssets,
      ensRegistry,
      supportedAssets,
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

    // services are left for archanova only and will be decomissioned later
    const isArchanovaAccountActive = isArchanovaAccount(getActiveAccount(accounts));

    switch (event.tag) {
      case PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT:
        const activatePillarNetworkButton = {
          title: t('button.activatePPN'),
          onPress: this.topUpPillarNetwork,
        };

        eventData = {
          actionTitle: t('label.activated'),
          actionSubtitle: this.getFeeLabel(event),
          buttons: !isPPNActivated && isArchanovaAccountActive
            ? [activatePillarNetworkButton]
            : [],
        };
        break;
      case PAYMENT_NETWORK_ACCOUNT_TOPUP:
        if (!isArchanovaAccountActive) break;
        const topUpMoreButton = {
          title: t('button.topUpMore'),
          onPress: this.topUpPillarNetwork,
          secondary: true,
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
      case SET_ARCHANOVA_WALLET_ACCOUNT_ENS:
        eventData = {
          name: t('ensName'),
          actionTitle: t('label.registered'),
          actionSubtitle: event.extra.ensName,
        };
        break;
      case PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL:
        if (!isArchanovaAccountActive) break;
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
        if (!isArchanovaAccountActive) break;
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
      case ARCHANOVA_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER:
        eventData = {
          name: t('label.smartWalletGasRelayerPLR'),
          actionTitle: isPending ? t('label.enabling') : t('label.enabled'),
        };
        break;
      case ARCHANOVA_WALLET_ACCOUNT_DEVICE_ADDED:
        eventData = {
          name: t('label.newSmartWalletAccountDevice'),
          actionTitle: isPending ? t('label.adding') : t('label.added'),
        };
        break;
      case ARCHANOVA_WALLET_ACCOUNT_DEVICE_REMOVED:
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
        if (event?.asset && isArchanovaAccountActive) {
          aaveDepositButtons.push({
            title: t('button.depositMore'),
            onPress: this.onAaveDepositMore,
            secondary: true,
          });
          if (aaveDepositedAsset) {
            aaveDepositButtons.push({
              title: t('button.viewDeposit'),
              onPress: () => this.onAaveViewDeposit(aaveDepositedAsset),
              secondary: true,
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
        if (event?.asset && aaveDepositedAsset && isArchanovaAccountActive) {
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
            secondary: true,
          });
        }
        eventData.buttons = aaveWithdrawButtons;
        break;
      case POOLTOGETHER_DEPOSIT_TRANSACTION:
      case POOLTOGETHER_WITHDRAW_TRANSACTION: {
        const { extra: { symbol } } = event;
        const buttons = [];

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
            secondary: true,
          },
        );

        eventData = {
          name: t('poolTogether'),
          customActionTitle: this.renderPoolTogetherTickets(event),
          buttons: isArchanovaAccountActive ? buttons : [],
        };
        break;
      }
      case SABLIER_CREATE_STREAM: {
        const { contactAddress, streamId } = event.extra;
        const usernameOrAddress = findEnsNameCaseInsensitive(ensRegistry, contactAddress) || contactAddress;
        const buttons = [{
          title: t('button.viewSablierStream'),
          secondary: true,
          onPress: () => this.goToOutgoingStream(streamId),
        }];

        eventData = {
          name: usernameOrAddress,
          sublabel: t('label.outgoingSablierStream'),
          actionSubtitle: t('label.started'),
          fee: this.getFeeLabel(event),
          buttons: isArchanovaAccountActive ? buttons : [],
        };
        break;
      }
      case SABLIER_WITHDRAW: {
        const { incomingStreams } = this.props;
        const { contactAddress, assetAddress, streamId } = event.extra;
        const usernameOrAddress = findEnsNameCaseInsensitive(ensRegistry, contactAddress) || contactAddress;
        const assetData = getAssetDataByAddress([], supportedAssets, assetAddress);
        const { symbol, decimals } = assetData;

        const stream = incomingStreams.find(({ id }) => id === streamId);
        const formattedStreamAmount = formatAmount(formatUnits(stream?.deposit, decimals), getDecimalPlaces(symbol));

        const buttons = [
          {
            title: t('button.withdrawMore'),
            secondary: true,
            onPress: () => this.goToStreamWithdraw(streamId),
          },
          {
            title: t('button.viewSablierStream'),
            secondary: true,
            onPress: () => this.goToIncomingStream(streamId),
          },
        ];

        eventData = {
          name: usernameOrAddress,
          sublabel: t('label.withdraw'),
          fee: this.getFeeLabel(event),
          actionSubtitle: t('sablierContent.label.ofTokenValueStream', { value: formattedStreamAmount, token: symbol }),
          buttons: isArchanovaAccountActive ? buttons : [],
        };
        break;
      }
      case SABLIER_CANCEL_STREAM:
      case WBTC_PENDING_TRANSACTION:
        return null;
      case RARI_DEPOSIT_TRANSACTION:
      case RARI_CLAIM_TRANSACTION:
      case RARI_WITHDRAW_TRANSACTION: {
        const {
          symbol, decimals, amount, rftMinted, rftBurned, claimed, rariPool, rgtBurned,
        } = event.extra;
        let label = null;
        let subtext = null;
        let negativeValueAmount = null;
        let negativeValueToken = null;
        let positiveValueAmount = null;
        let positiveValueToken = null;
        const buttons = [];

        const rariToken = rariPool && RARI_TOKENS_DATA[rariPool].symbol;
        const formattedAmount = formatAmount(
          formatUnits(amount || claimed, decimals), symbol ? getDecimalPlaces(symbol) : 6);

        if (event.tag === RARI_DEPOSIT_TRANSACTION) {
          label = t('label.deposit');
          subtext = t('label.fromWalletToRari');
          negativeValueAmount = formattedAmount;
          negativeValueToken = symbol;
          positiveValueAmount = formatAmount(formatUnits(rftMinted, 18));
          positiveValueToken = rariToken;
          buttons.push({
            secondary: true,
            title: t('button.depositMore'),
            onPress: () => this.goToRariDeposit(),
          });
        } else if (event.tag === RARI_WITHDRAW_TRANSACTION) {
          label = t('label.withdrawal');
          subtext = t('label.fromRariToWallet');
          negativeValueAmount = formatAmount(formatUnits(rftBurned, 18));
          negativeValueToken = rariToken;
          positiveValueAmount = formattedAmount;
          positiveValueToken = symbol;
          buttons.push({
            secondary: true,
            title: t('button.withdrawMore'),
            onPress: () => this.goToRariDeposit(),
          });
        } else {
          label = t('label.rewardsClaimed');
          subtext = t('label.fromRariToWallet');
          negativeValueAmount = formattedAmount;
          positiveValueAmount = formatAmount(formatUnits(EthersBigNumber.from(amount).sub(rgtBurned), 18));
          negativeValueToken = RARI_GOVERNANCE_TOKEN_DATA.symbol;
          positiveValueToken = RARI_GOVERNANCE_TOKEN_DATA.symbol;
          buttons.push({
            secondary: true,
            title: t('button.claimMore'),
            onPress: () => this.goToRariClaim(),
          });
        }

        eventData = {
          name: label,
          sublabel: subtext,
          buttons: isArchanovaAccountActive ? buttons : [],
          fee: this.getFeeLabel(event),
          customActionTitle: (
            <ListWrapper>
              <MediumText large lineHeight={24}>
                {t('negativeTokenValue', { value: negativeValueAmount, token: negativeValueToken })}
              </MediumText>
              <MediumText large positive lineHeight={38}>
                {t('positiveTokenValue', { value: positiveValueAmount, token: positiveValueToken })}
              </MediumText>
            </ListWrapper>
          ),
        };
        break;
      }
      case RARI_TRANSFER_TRANSACTION: {
        const buttons = [{
          secondary: true,
          title: t('button.transferMore'),
          onPress: () => this.goToRariDeposit(),
        }];
        eventData = {
          fee: this.getFeeLabel(event),
          buttons: isArchanovaAccountActive ? buttons : [],
        };
        break;
      }
      case LIQUIDITY_POOLS_ADD_LIQUIDITY_TRANSACTION: {
        const {
          amount, pool, tokenAmounts,
        } = event.extra;
        const tokensData = pool.tokensProportions.map(
          ({ symbol: tokenSymbol }) => supportedAssets.find(({ symbol }) => symbol === tokenSymbol),
        );
        eventData = {
          fee: this.getFeeLabel(event),
          customActionTitle: this.renderLiquidityPoolsExchange(
            tokensData, tokenAmounts, [pool], [amount], { topTokensSecondary: true },
          ),
          buttons: isArchanovaAccountActive
            ? this.getLiquidityEventButtons(t('button.addMoreLiquidity'), pool)
            : [],
        };
        break;
      }
      case LIQUIDITY_POOLS_REMOVE_LIQUIDITY_TRANSACTION: {
        const { amount, pool, tokenAmounts } = event.extra;
        const tokensData = pool.tokensProportions.map(
          ({ symbol: tokenSymbol }) => supportedAssets.find(({ symbol }) => symbol === tokenSymbol),
        );
        eventData = {
          fee: this.getFeeLabel(event),
          customActionTitle: this.renderLiquidityPoolsExchange(
            [pool], [amount], tokensData, tokenAmounts, { bottomTokensSecondary: true },
          ),
          buttons: isArchanovaAccountActive
            ? this.getLiquidityEventButtons(t('button.removeMoreLiquidity'), pool)
            : [],
        };
        break;
      }
      case LIQUIDITY_POOLS_STAKE_TRANSACTION: {
        const { pool } = event.extra;
        eventData = {
          fee: this.getFeeLabel(event),
          buttons: isArchanovaAccountActive
            ? this.getLiquidityEventButtons(t('button.stakeMoreLiquidity'), pool)
            : [],
        };
        break;
      }
      case LIQUIDITY_POOLS_UNSTAKE_TRANSACTION: {
        const { pool } = event.extra;
        eventData = {
          fee: this.getFeeLabel(event),
          buttons: isArchanovaAccountActive
            ? this.getLiquidityEventButtons(t('button.unstakeMoreLiquidity'), pool)
            : [],
        };
        break;
      }
      case LIQUIDITY_POOLS_REWARDS_CLAIM_TRANSACTION: {
        const { pool } = event.extra;
        eventData = {
          fee: this.getFeeLabel(event),
          buttons: isArchanovaAccountActive
            ? this.getLiquidityEventButtons(t('button.claimMoreRewards'), pool)
            : [],
        };
        break;
      }
      default:
        const isPPNTransaction = get(event, 'isPPNTransaction', false);
        const isBetweenArchanovaAccounts = isArchanovaAccountAddress(event.from, accounts)
          && isArchanovaAccountAddress(event.to, accounts);

        const actionSubtitle = isReceived ? t('label.toPPN') : t('label.fromPPN');
        const isZeroValue = formattedValue === '0';

        if (isPPNTransaction) {
          eventData = {
            customActionTitle: !isBetweenArchanovaAccounts && (
              <TankAssetBalance
                amount={
                  getFormattedValue(formattedValue, event.asset, { isPositive: !!isReceived, noSymbol: isZeroValue })
                }
                textStyle={{ fontSize: fontSizes.large }}
                iconStyle={{ height: 14, width: 8, marginRight: 9 }}
              />
            ),
            actionSubtitle: !isBetweenArchanovaAccounts ? actionSubtitle : '',
          };

          if (isReceived) {
            if (isBetweenArchanovaAccounts) {
              eventData.buttons = [];
            } else {
              eventData.buttons = [
                {
                  title: t('button.sendBack'),
                  onPress: () => this.sendSynthetic(relevantAddress),
                  secondary: true,
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
            secondary: true,
          }];
          eventData = {
            name: t('poolTogether'),
            buttons: isArchanovaAccountActive ? buttons : [],
          };
        } else {
          eventData = {
            actionTitle: fullItemValue,
          };

          let buttons = [];

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

          if (isReceived) {
            if (!isPending) {
              buttons = [sendBackToAddress];
            }
          } else if (!isPending) {
            buttons = [sendMoreToAddress];
          }
          eventData.buttons = buttons;
          if (!isReceived) {
            eventData.fee = this.getFeeLabel(event);
          }
        }
    }

    if (!eventData) return null;

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

    // $FlowFixMe: js hacks
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
                  failed={isFailed}
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
          <Spacing h={8} />
          <Divider />
          <Spacing h={18} />
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

  getFee = (hash: string, fee: ?string, isReceived?: boolean) => {
    const { updatingTransaction, updatingCollectibleTransaction } = this.props;
    if (isReceived) return null;
    if (fee) {
      return fee;
    } else if (updatingTransaction === hash || updatingCollectibleTransaction === hash) {
      return FEE_PENDING;
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
    const titleColor = this.getColor(valueColor) || undefined;

    const commonProps = {
      date: date !== undefined ? new Date(date * 1000) : undefined,
      title: label,
      subtitle: sublabel,
      image: this.renderImage(itemData),
      buttons,
    };

    if (settleEventData) {
      return (
        // $FlowFixMe: flow update to 0.122
        <DetailModal {...commonProps}>
          {this.renderSettle(settleEventData, eventData)}
        </DetailModal>
      );
    }

    return (
      // $FlowFixMe: flow update to 0.122
      <DetailModal
        {...commonProps}
        fee={this.getFee(event.hash, fee, isReceived)}
      >
        {!!title && (
          <DetailRow color={titleColor}>
            {title}
            {!!actionIcon && <ActionIcon name={actionIcon} iconColor={this.getColor(statusIconColor)} />}
          </DetailRow>
        )}
        {customActionTitle}
        {!!subtitle && <DetailParagraph>{subtitle}</DetailParagraph>}
        {!!errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </DetailModal>
    );
  };

  render() {
    let { event } = this.props;

    if (event.type === TRANSACTION_EVENT || event.type === COLLECTIBLE_TRANSACTION) {
      const txInfo = this.findTxInfo(event.type === COLLECTIBLE_TRANSACTION) || {};
      event = { ...event, ...txInfo, type: event.type };
    }

    let eventData = this.getEventData(event);

    if (!eventData) return null;
    const { hash, isPPNTransaction, batchHash } = event;
    const allowViewOnBlockchain = (!!hash || !!batchHash) && !isPPNTransaction;

    if (allowViewOnBlockchain) {
      const currentModalButtons = eventData?.buttons || [];
      const hasModalButtons = !isEmpty(currentModalButtons);
      const viewOnBlockchainButtonTitle = t('button.viewOnBlockchain');
      const alreadyHasViewOnBlockchainButton = hasModalButtons
        && currentModalButtons.some(({ title }) => title === viewOnBlockchainButtonTitle);

      if (!alreadyHasViewOnBlockchainButton) {
        const viewOnBlockchainButton = {
          transparent: hasModalButtons, // styling if multiple buttons in modal
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

    return this.renderContent(event, eventData);
  }
}

const mapStateToProps = ({
  rates: { data: ratesPerChain },
  appSettings: { data: { baseFiatCurrency } },
  user: { data: user },
  accounts: { data: accounts },
  ensRegistry: { data: ensRegistry },
  history: { data: history, updatingTransaction },
  collectibles: { updatingTransaction: updatingCollectibleTransaction },
  lending: { depositedAssets },
  poolTogether: { poolStats },
  sablier: { incomingStreams, outgoingStreams },
}: RootReducerState): StateProps => ({
  ratesPerChain,
  baseFiatCurrency,
  user,
  accounts,
  ensRegistry,
  history,
  updatingTransaction,
  updatingCollectibleTransaction,
  depositedAssets,
  poolStats,
  incomingStreams,
  outgoingStreams,
});

const structuredSelector: Selector<SelectorProps, OwnProps> = createStructuredSelector({
  PPNTransactions: PPNTransactionsSelector,
  mergedPPNTransactions: combinedPPNTransactionsSelector,
  isArchanovaWalletActivated: isArchanovaAccountDeployedSelector,
  assetDecimals: assetDecimalsSelector((_, props) => props.event.asset),
  activeAccountAddress: activeAccountAddressSelector,
  accountAssets: accountEthereumAssetsSelector,
  activeBlockchainNetwork: activeBlockchainSelector,
  isPPNActivated: isPPNActivatedSelector,
  collectiblesHistory: collectiblesHistorySelector,
  supportedAssets: ethereumSupportedAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState, props: OwnProps): {| ...SelectorProps, ...StateProps |} => ({
  ...structuredSelector(state, props),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  updateTransactionStatus: (hash) => dispatch(updateTransactionStatusAction(hash)),
  updateCollectibleTransaction: (hash) => dispatch(updateCollectibleTransactionAction(hash)),
  lookupAddress: (address) => dispatch(lookupAddressAction(address)),
});

type ExportedComponent = React.AbstractComponent<OwnProps>;
export default (withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(EventDetail)): ExportedComponent);
