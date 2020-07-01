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
import { createStructuredSelector } from 'reselect';
import get from 'lodash.get';
import isEqual from 'lodash.isequal';
import styled, { withTheme } from 'styled-components/native';
import { SDK_PROVIDER } from 'react-native-dotenv';

// utils
import { getThemeColors, themedColors } from 'utils/themes';
import { addressesEqual } from 'utils/assets';
import { createAlert } from 'utils/alerts';
import { fontSizes, spacing } from 'utils/variables';
import {
  elipsizeAddress,
  isPendingTransaction,
  isSWAddress,
  isKWAddress,
  groupPPNTransactions,
  getUsernameOrAddress,
  isBTCAddress,
  isFailedTransaction,
  isTimedOutTransaction,
} from 'utils/feedData';
import { findMatchingContact } from 'utils/contacts';
import { findAccountByAddress, getAccountName } from 'utils/accounts';
import { images, isSvgImage } from 'utils/images';

// components
import {
  formatAmount,
  formatUnits,
  getDecimalPlaces,
} from 'utils/common';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import TankAssetBalance from 'components/TankAssetBalance';
import { BaseText } from 'components/Typography';

// constants
import {
  TYPE_RECEIVED,
  TYPE_ACCEPTED,
  TYPE_REJECTED,
  TYPE_SENT,
} from 'constants/invitationsConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import {
  TRANSACTION_EVENT,
  TX_PENDING_STATUS,
  TX_FAILED_STATUS,
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
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { AAVE_LENDING_DEPOSIT_TRANSACTION, AAVE_LENDING_WITHDRAW_TRANSACTION } from 'constants/lendingConstants';

// selectors
import { activeAccountAddressSelector, bitcoinAddressSelector } from 'selectors';
import { assetDecimalsSelector } from 'selectors/assets';
import { isSmartWalletActivatedSelector } from 'selectors/smartWallet';

// types
import type { ContactSmartAddressData, ApiUser } from 'models/Contacts';
import type { Theme } from 'models/Theme';
import type { RootReducerState } from 'reducers/rootReducer';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { Accounts } from 'models/Account';
import type { TransactionsGroup } from 'utils/feedData';
import type { BitcoinAddress } from 'models/Bitcoin';
import type { ReferralRewardsIssuersAddresses } from 'reducers/referralsReducer';
import type { Asset } from 'models/Asset';
import type { AaveExtra } from 'models/Transaction';


type Props = {
  type?: string,
  asset?: string,
  isPending?: boolean,
  selectEvent: Function,
  contacts: ApiUser[],
  contactsSmartAddresses: ContactSmartAddressData[],
  ensRegistry: EnsRegistry,
  theme: Theme,
  event: Object,
  feedType?: string,
  acceptInvitation: Function,
  rejectInvitation: Function,
  activeAccountAddress: string,
  accounts: Accounts,
  isSmartWalletActivated: boolean,
  assetDecimals: number,
  bitcoinAddresses: BitcoinAddress[],
  isPPNView?: boolean,
  isForAllAccounts?: boolean,
  isAssetView?: boolean,
  referralRewardIssuersAddresses: ReferralRewardsIssuersAddresses,
  supportedAssets: Asset[],
};

export type EventData = {
  label?: string,
  itemImageSource?: string,
  actionLabel?: ?string,
  badge?: ?string,
  subtext?: string,
  labelAsButton?: boolean,
  rejectInvitation?: Function,
  acceptInvitation?: Function,
  avatarUrl?: string,
  username?: string,
  itemImageUrl?: string,
  iconName?: ?string,
  iconColor?: string,
  itemValue?: string,
  fullItemValue?: string,
  valueColor?: string,
  customAddon?: React.Node,
  itemStatusIcon?: string,
  iconBackgroundColor?: string,
  iconBorder?: boolean,
  fallbackToGenericToken?: boolean,
  secondaryButton?: boolean,
  buttonActionLabel?: string,
  isReceived?: boolean,
  isBetweenAccounts?: boolean,
  collectibleUrl?: string,
  statusIconColor?: ?string,
  isFailed?: boolean,
  itemImageRoundedSquare?: boolean,
  cornerIcon?: string,
};

const NAMES = {
  SMART_WALLET: 'Smart Wallet',
  KEY_WALLET: 'Key wallet',
  PPN_NETWORK: 'Pillar Network',
  AAVE_DEPOSIT: 'Aave Deposit',
};

const STATUSES = {
  CREATED: 'Created',
  IMPORTED: 'Imported',
  RECEIVED: 'Received',
  SENT: 'Sent',
  CONNECTED: 'Connected',
  REQUESTED: 'Requested',
  BACKUP: 'Backup secured',
  ACTIVATED: 'Activated',
};

const ListWrapper = styled.View`
  align-items: flex-end;
  padding-left: ${spacing.mediumLarge}px;
`;

const ItemValue = styled(BaseText)`
  font-size: ${fontSizes.big}px;
  color: ${themedColors.positive};
  text-align: right;
`;

const aaveImage = require('assets/images/apps/aave.png');

export class ActivityFeedItem extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const isEq = isEqual(this.props, nextProps);
    return !isEq;
  }

  isReceived = (event: Object): boolean => {
    const { to, isReceived, from } = event;
    const {
      bitcoinAddresses,
      activeAccountAddress,
      isForAllAccounts,
      accounts,
    } = this.props;

    if (isForAllAccounts) {
      const isBetweenAccounts = (isSWAddress(to, accounts) && isKWAddress(from, accounts))
        || (isSWAddress(from, accounts) && isKWAddress(to, accounts));
      return (isBetweenAccounts && isReceived)
        || (!isBetweenAccounts && isKWAddress(to, accounts))
        || (!isBetweenAccounts && isSWAddress(to, accounts))
        || bitcoinAddresses.some(e => e.address === to);
    }

    return addressesEqual(to, activeAccountAddress) || bitcoinAddresses.some(e => e.address === to);
  };

  isZeroValue(value: string): boolean {
    return value === '0' || value === '0.0';
  }

  getRelevantAddress = (event: Object): string => {
    const isReceived = this.isReceived(event);
    return isReceived ? event.from : event.to;
  };

  getFormattedSettleValues = () => {
    const {
      event,
      asset,
      assetDecimals,
    } = this.props;
    const settleData = event.extra;
    const ppnTransactions = asset
      ? settleData.filter(({ symbol }) => symbol === asset)
      : settleData;

    const groupedPPNTransactions: TransactionsGroup[] = groupPPNTransactions(ppnTransactions);

    const formattedValuesArray: Object[] = groupedPPNTransactions.map(({ symbol, value }): Object => ({
      formatted: formatAmount(formatUnits(value.toString(), assetDecimals), getDecimalPlaces(symbol)),
      symbol,
    }));
    return formattedValuesArray;
  };

  getAaveDisplayAmount = (prefix: string) => {
    const { event } = this.props;
    if (!event?.extra) return '';
    const { amount, symbol, decimals }: AaveExtra = event.extra;
    if (!amount || !symbol) return '';
    const value = formatUnits(amount, decimals);
    return `${prefix} ${formatAmount(value, getDecimalPlaces(symbol))} ${symbol}`;
  };


  getAaveDepositedAssetImage = () => {
    const { event, supportedAssets } = this.props;
    if (!event?.extra?.symbol) return '';
    const { iconUrl } = supportedAssets.find(({ symbol }) => symbol === event.extra.symbol) || {};
    return iconUrl ? { uri: `${SDK_PROVIDER}/${iconUrl}?size=3` } : '';
  };

  getWalletCreatedEventData = (event: Object) => {
    const { isSmartWalletActivated, theme } = this.props;
    const { keyWalletIcon, smartWalletIcon } = images(theme);
    switch (event.eventTitle) {
      case 'Wallet created':
        return {
          label: NAMES.KEY_WALLET,
          itemImageSource: keyWalletIcon,
          actionLabel: STATUSES.CREATED,
        };
      case 'Smart Wallet created':
        return {
          label: NAMES.SMART_WALLET,
          itemImageSource: smartWalletIcon,
          actionLabel: STATUSES.CREATED,
          badge: isSmartWalletActivated ? null : 'Need to activate',
        };
      case 'Wallet imported':
        return {
          label: NAMES.KEY_WALLET,
          itemImageSource: keyWalletIcon,
          actionLabel: 'Imported',
        };
      default:
        return null;
    }
  };

  getUserEventData = (event: Object) => {
    const { isSmartWalletActivated, theme } = this.props;
    const { keyWalletIcon, PPNIcon } = images(theme);
    switch (event.subType) {
      case WALLET_CREATE_EVENT:
        return this.getWalletCreatedEventData(event);
      case PPN_INIT_EVENT:
        return {
          label: NAMES.PPN_NETWORK,
          itemImageSource: PPNIcon,
          actionLabel: STATUSES.CREATED,
          badge: isSmartWalletActivated ? null : 'Need to activate',
        };
      case WALLET_BACKUP_EVENT:
        return {
          label: NAMES.KEY_WALLET,
          itemImageSource: keyWalletIcon,
          actionLabel: STATUSES.BACKUP,
        };
      default:
        return null;
    }
  };

  getTransactionEventData = (event: Object) => {
    const {
      ensRegistry,
      assetDecimals,
      accounts,
      contacts,
      contactsSmartAddresses,
      theme,
      isPPNView,
      bitcoinAddresses,
      isForAllAccounts,
      isAssetView,
      referralRewardIssuersAddresses,
      supportedAssets,
    } = this.props;

    const isReceived = this.isReceived(event);
    const value = formatUnits(event.value, assetDecimals);
    const relevantAddress = this.getRelevantAddress(event);
    const contact = findMatchingContact(relevantAddress, contacts, contactsSmartAddresses) || {};
    const avatarUrl = contact && contact.profileImage;

    const assetSymbol = event ? event.asset : null;
    const decimalPlaces = getDecimalPlaces(assetSymbol);
    const formattedValue = formatAmount(value, decimalPlaces);
    const formattedFullValue = formatAmount(value);
    const directionIcon = isReceived ? 'received' : 'sent';
    let directionSymbol = isReceived ? '+ ' : '- ';
    let PPNDirectionSymbol = event.tag === PAYMENT_NETWORK_ACCOUNT_TOPUP
    && !isAssetView && !event.smartWalletEvent ? '+ ' : '- ';

    const isFailed = isFailedTransaction(event) || isTimedOutTransaction(event);

    if (this.isZeroValue(value) || isFailed) {
      directionSymbol = '';
      PPNDirectionSymbol = '';
    }

    const isPending = isPendingTransaction(event);

    let data: EventData = {};

    const {
      smartWalletIcon,
      PPNIcon,
      roundedPhoneIcon,
      keyWalletIcon,
    } = images(theme);

    switch (event.tag) {
      case PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT:
        data = {
          label: NAMES.SMART_WALLET,
          itemImageSource: smartWalletIcon,
          actionLabel: STATUSES.ACTIVATED,
        };
        break;
      case PAYMENT_NETWORK_ACCOUNT_TOPUP:
        if (isAssetView) {
          data = {
            label: NAMES.PPN_NETWORK,
            subtext: `from ${NAMES.SMART_WALLET}`,
            itemImageSource: PPNIcon,
            fullItemValue: `${PPNDirectionSymbol}${formattedFullValue} ${event.asset}`,
            itemValue: `${PPNDirectionSymbol}${formattedValue} ${event.asset}`,
            valueColor: 'text',
          };
        } else if (isPPNView) {
          data = {
            label: 'Top Up',
            subtext: `from ${NAMES.SMART_WALLET}`,
            itemImageSource: PPNIcon,
            fullItemValue: `${PPNDirectionSymbol}${formattedFullValue} ${event.asset}`,
            itemValue: `${PPNDirectionSymbol}${formattedValue} ${event.asset}`,
            valueColor: 'positive',
          };
        } else if (event.smartWalletEvent) {
          data = {
            label: NAMES.SMART_WALLET,
            subtext: 'to Pillar Network',
            itemImageSource: smartWalletIcon,
            fullItemValue: `${PPNDirectionSymbol}${formattedFullValue} ${event.asset}`,
            itemValue: `${PPNDirectionSymbol}${formattedValue} ${event.asset}`,
            valueColor: 'text',
          };
        } else {
          data = {
            label: NAMES.PPN_NETWORK,
            subtext: 'Top up',
            itemImageSource: PPNIcon,
            fullItemValue: `${PPNDirectionSymbol}${formattedFullValue} ${event.asset}`,
            itemValue: `${PPNDirectionSymbol}${formattedValue} ${event.asset}`,
            valueColor: 'positive',
          };
        }
        break;
      case SET_SMART_WALLET_ACCOUNT_ENS:
        data = {
          label: NAMES.SMART_WALLET,
          itemImageSource: smartWalletIcon,
          subtext: 'Register ENS label',
        };
        break;
      case PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL:
        data = {
          fullItemValue: `${PPNDirectionSymbol}${formattedFullValue} ${event.asset}`,
          itemValue: `${PPNDirectionSymbol}${formattedValue} ${event.asset}`,
          valueColor: 'text',
        };
        if (isPPNView) {
          data.label = 'Withdraw';
          data.subtext = 'to Smart Wallet';
          data.iconName = 'sent';
          data.iconColor = 'negative';
        } else {
          data.label = NAMES.PPN_NETWORK;
          data.subtext = 'Withdrawal';
          data.itemImageSource = PPNIcon;
        }
        break;
      case PAYMENT_NETWORK_TX_SETTLEMENT:
        const transactionsCount = event.extra.length;
        const formattedValuesArray = this.getFormattedSettleValues();
        const valueSymbol = isFailed ? '' : '- ';
        data = {
          label: 'Settle',
          itemImageSource: PPNIcon,
          subtext: 'to Smart Wallet',
          customAddonAlignLeft: true,
          rightColumnInnerStyle: { flexDirection: 'row', alignItems: 'center' },
          customAddon: (
            <ListWrapper>
              {formattedValuesArray.map(({ formatted, symbol }) => (
                <TankAssetBalance
                  key={symbol}
                  amount={`${valueSymbol}${formatted} ${symbol}`}
                  secondary={isFailed}
                />
              ))}
              {!isFailed && isPPNView && transactionsCount > 1 && (
                <BaseText regular secondary>Total {transactionsCount}</BaseText>
              )}
              {!isFailed && !isPPNView && formattedValuesArray.map(({ formatted, symbol }) =>
                <ItemValue key={symbol}>{`+ ${formatted} ${symbol}`}</ItemValue>,
              )}
            </ListWrapper>),
        };
        break;
      case SMART_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER:
        data = {
          label: NAMES.SMART_WALLET,
          itemImageSource: smartWalletIcon,
          subtext: 'Enable transaction fees with PLR',
        };
        break;
      case SMART_WALLET_ACCOUNT_DEVICE_ADDED:
        data = {
          label: NAMES.SMART_WALLET,
          itemImageSource: roundedPhoneIcon,
          subtext: 'New account device added',
          actionLabel: 'Added',
        };
        break;
      case SMART_WALLET_ACCOUNT_DEVICE_REMOVED:
        data = {
          label: NAMES.SMART_WALLET,
          itemImageSource: roundedPhoneIcon,
          subtext: 'Account device removed',
          actionLabel: 'Removed',
        };
        break;
      case AAVE_LENDING_DEPOSIT_TRANSACTION:
        const depositDisplayValue = this.getAaveDisplayAmount('-');
        data = {
          label: NAMES.AAVE_DEPOSIT,
          itemValue: depositDisplayValue,
          fullItemValue: depositDisplayValue,
          valueColor: 'text',
          itemImageSource: aaveImage,
          itemImageRoundedSquare: true,
          iconImageSize: 52,
          cornerIcon: this.getAaveDepositedAssetImage(),
        };
        break;
      case AAVE_LENDING_WITHDRAW_TRANSACTION:
        const withdrawDisplayValue = this.getAaveDisplayAmount('+');
        data = {
          label: NAMES.AAVE_DEPOSIT,
          itemValue: withdrawDisplayValue,
          fullItemValue: withdrawDisplayValue,
          valueColor: 'positive',
          itemImageSource: aaveImage,
          itemImageRoundedSquare: true,
          iconImageSize: 52,
          cornerIcon: this.getAaveDepositedAssetImage(),
        };
        break;
      default:
        const usernameOrAddress = event.username
          || ensRegistry[relevantAddress]
          || elipsizeAddress(relevantAddress);
        const isPPNTransaction = get(event, 'isPPNTransaction', false);
        let subtext = getAccountName(event.accountType);
        const keyWallet = getAccountName(ACCOUNT_TYPES.KEY_BASED);
        const smartWallet = getAccountName(ACCOUNT_TYPES.SMART_WALLET);

        const isTrxBetweenSWAccount = isSWAddress(event.from, accounts) && isSWAddress(event.to, accounts);
        const isReferralRewardTransaction = referralRewardIssuersAddresses.includes(relevantAddress) && isReceived;

        if (isPPNTransaction) {
          if (isTrxBetweenSWAccount) {
            data = {
              label: isAssetView ? NAMES.PPN_NETWORK : smartWallet,
              subtext: isAssetView ? `to ${smartWallet}` : 'from Pillar Network',
              itemImageSource: isAssetView ? PPNIcon : smartWalletIcon,
              isReceived: true,
              fullItemValue: `+ ${formattedFullValue} ${event.asset}`,
              itemValue: `+ ${formattedValue} ${event.asset}`,
              valueColor: 'positive',
            };
          } else {
            data = {
              label: usernameOrAddress,
              avatarUrl,
              isReceived,
              username: contact?.username,
            };

            if (event.extra) {
              const { syntheticTransaction: { toAmount, toAssetCode } } = event.extra;
              data.customAddon = (
                <ListWrapper>
                  <TankAssetBalance amount={`${directionSymbol}${toAmount} ${toAssetCode}`} />
                  {!isReceived && <BaseText regular secondary>{formattedValue} {event.asset}</BaseText>}
                </ListWrapper>
              );
            } else {
              data.customAddon = (
                <ListWrapper>
                  <TankAssetBalance amount={`${directionSymbol}${formattedValue} ${event.asset}`} />
                </ListWrapper>
              );
            }
          }
        } else {
          const additionalInfo = {};
          let itemLabel = usernameOrAddress;
          const isTrxBetweenAccounts = (isKWAddress(event.to, accounts) && isSWAddress(event.from, accounts)) ||
            (isKWAddress(event.from, accounts) && isSWAddress(event.to, accounts));

          const sendingAccountType = isReceived
            ? (findAccountByAddress(event.to, accounts) || {}).type
            : (findAccountByAddress(event.from, accounts) || {}).type;

          if (isTrxBetweenAccounts) {
            if (isForAllAccounts) {
              itemLabel = getAccountName(sendingAccountType);
              additionalInfo.itemImageSource = sendingAccountType === ACCOUNT_TYPES.KEY_BASED
                ? keyWalletIcon
                : smartWalletIcon;
            } else {
              additionalInfo.itemImageSource = event.accountType === ACCOUNT_TYPES.KEY_BASED
                ? keyWalletIcon
                : smartWalletIcon;
            }
            additionalInfo.isBetweenAccounts = true;
          }

          if (isTrxBetweenAccounts && isForAllAccounts) {
            const receivingAccountType = isReceived
              ? (findAccountByAddress(event.from, accounts) || {}).type
              : (findAccountByAddress(event.to, accounts) || {}).type;
            const accountName = getAccountName(receivingAccountType);
            subtext = accountName ? `${isReceived ? 'from' : 'to'} ${accountName}` : '';
          } else if (isReceived && isKWAddress(event.to, accounts)) {
            subtext = `to ${keyWallet}`;
          } else if (isReceived && isSWAddress(event.to, accounts)) {
            subtext = `to ${smartWallet}`;
          } else if (!isReceived && isSWAddress(event.from, accounts)) {
            subtext = `from ${smartWallet}`;
          } else if (!isReceived && isKWAddress(event.from, accounts)) {
            subtext = `from ${keyWallet}`;
          } else if (isReceived && isBTCAddress(event.to, bitcoinAddresses)) {
            subtext = 'to Bitcoin wallet';
          } else if (!isReceived && isBTCAddress(event.from, bitcoinAddresses)) {
            subtext = 'from Bitcoin wallet';
          }

          if (!isTrxBetweenAccounts) {
            additionalInfo.iconName = !avatarUrl ? directionIcon : null;
            additionalInfo.iconColor = isReceived ? 'transactionReceivedIcon' : 'negative';
          }

          if (isReferralRewardTransaction) {
            let referralAwardTokenImage;
            const referralAwardAssetData = supportedAssets.find(({ symbol }) => symbol === event.asset);
            if (referralAwardAssetData) {
              const { iconUrl } = referralAwardAssetData;
              referralAwardTokenImage = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : '';
              additionalInfo.iconName = null;
              additionalInfo.avatarUrl = referralAwardTokenImage;
            }
            additionalInfo.label = 'Referral reward';
          }

          data = {
            label: itemLabel,
            subtext,
            avatarUrl,
            username: contact?.username,
            fullItemValue: `${directionSymbol}${formattedFullValue} ${event.asset}`,
            itemValue: `${directionSymbol}${formattedValue} ${event.asset}`,
            valueColor: isReceived && !this.isZeroValue(value) ? 'positive' : 'text',
            ...additionalInfo,
            isReceived,
          };
        }
    }
    data.itemStatusIcon = isPending ? TX_PENDING_STATUS : '';
    if (isFailed) {
      data.itemStatusIcon = TX_FAILED_STATUS;
      data.statusIconColor = this.getColor('negative');
      data.isFailed = true;
    }
    return data;
  };

  getCollectibleTransactionEventData = (event: Object) => {
    const { contacts, accounts } = this.props;
    const isReceived = this.isReceived(event);
    const {
      asset,
      to,
      from,
      assetData: { image },
      icon,
    } = event;

    const relevantAddress = this.getRelevantAddress(event);

    let usernameOrAddress;
    const isBetweenAccounts = (isSWAddress(to, accounts) && isKWAddress(from, accounts))
      || (isSWAddress(from, accounts) && isKWAddress(to, accounts));

    if (isBetweenAccounts) {
      const relatedAccountType = isReceived
        ? (findAccountByAddress(event.from, accounts) || {}).type
        : (findAccountByAddress(event.to, accounts) || {}).type;
      usernameOrAddress = getAccountName(relatedAccountType);
    } else {
      usernameOrAddress = getUsernameOrAddress(event, relevantAddress, contacts);
    }

    const subtext = `Collectible ${isReceived ? 'from' : 'to'} ${usernameOrAddress}`;

    return {
      label: asset,
      collectibleUrl: isSvgImage(image) ? image : icon,
      subtext,
      actionLabel: isReceived ? STATUSES.RECEIVED : STATUSES.SENT,
      iconBackgroundColor: 'card',
      iconBorder: true,
      fallbackToGenericToken: true,
      isReceived,
      isBetweenAccounts,
    };
  };

  getBadgeRewardEventData = (event: Object): EventData => {
    const { name, imageUrl } = event;
    return {
      label: name,
      itemImageUrl: imageUrl,
      subtext: 'Badge',
      actionLabel: STATUSES.RECEIVED,
    };
  };

  getSocialEventData = (event: Object): ?EventData => {
    const { rejectInvitation, acceptInvitation } = this.props;
    const { type, username, profileImage } = event;

    let actionLabel;
    if (type === TYPE_ACCEPTED) {
      actionLabel = STATUSES.CONNECTED;
    } else {
      actionLabel = null;
    }

    const data: EventData = {
      label: username,
      actionLabel,
      avatarUrl: profileImage,
      username,
    };

    if (type === TYPE_SENT) {
      data.buttonActionLabel = STATUSES.REQUESTED;
      data.secondaryButton = true;
    }

    if (type === TYPE_RECEIVED) {
      data.subtext = 'Connection request';
      data.rejectInvitation = () => createAlert(TYPE_REJECTED, event, () => rejectInvitation(event));
      data.acceptInvitation = () => acceptInvitation(event);
    }

    return data;
  };

  getEventData = (event: Object): ?EventData => {
    switch (event.type) {
      case USER_EVENT:
        return this.getUserEventData(event);
      case TRANSACTION_EVENT:
        return this.getTransactionEventData(event);
      case COLLECTIBLE_TRANSACTION:
        return this.getCollectibleTransactionEventData(event);
      case BADGE_REWARD_EVENT:
        return this.getBadgeRewardEventData(event);
      case TYPE_SENT:
      case TYPE_RECEIVED:
      case TYPE_ACCEPTED:
        return this.getSocialEventData(event);
      default:
        return null;
    }
  };

  getColor = (color: ?string): ?string => {
    if (!color) return null;
    const { theme } = this.props;
    const colors = getThemeColors(theme);
    return colors[color] || color;
  };

  render() {
    const { event, selectEvent } = this.props;
    const itemData = this.getEventData(event);

    if (!itemData) return null;

    const {
      iconColor,
      valueColor,
      iconBackgroundColor,
      isFailed,
    } = itemData;

    return (
      <ListItemWithImage
        {...itemData}
        onPress={() => selectEvent(event, itemData)}
        actionLabelColor={this.getColor('secondaryText')}
        iconColor={this.getColor(iconColor)}
        diameter={48}
        iconBackgroundColor={this.getColor(iconBackgroundColor)}
        valueColor={isFailed ? this.getColor('secondaryText') : this.getColor(valueColor)}
      />
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
  ensRegistry: { data: ensRegistry },
  accounts: { data: accounts },
  referrals: { referralRewardIssuersAddresses },
  assets: { supportedAssets },
}: RootReducerState): $Shape<Props> => ({
  contacts,
  contactsSmartAddresses,
  ensRegistry,
  accounts,
  referralRewardIssuersAddresses,
  supportedAssets,
});

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
  bitcoinAddresses: bitcoinAddressSelector,
  isSmartWalletActivated: isSmartWalletActivatedSelector,
  assetDecimals: assetDecimalsSelector((_, props) => props.event.asset),
});

const combinedMapStateToProps = (state: RootReducerState, props) => ({
  ...structuredSelector(state, props),
  ...mapStateToProps(state),
});

export default withTheme(connect(combinedMapStateToProps)(ActivityFeedItem));
