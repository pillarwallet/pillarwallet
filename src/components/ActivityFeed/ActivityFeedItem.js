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
import styled, { withTheme } from 'styled-components/native';
import BigNumber from 'bignumber.js';

// utils
import { getThemeColors, themedColors } from 'utils/themes';
import { addressesEqual, getAssetData, getAssetsAsList } from 'utils/assets';
import { createAlert } from 'utils/alerts';
import { findMatchingContact } from 'utils/contacts';
import { getSmartWalletStatus } from 'utils/smartWallet';
import { fontSizes, spacing } from 'utils/variables';
import { findAccountByAddress, checkIfSmartWalletAccount, checkIfKeyBasedAccount } from 'utils/accounts';

// components
import {
  formatAmount,
  formatUnits,
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
  CONNECTION_EVENT,
} from 'constants/historyConstants';
import {
  PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT,
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_TX_SETTLEMENT,
} from 'constants/paymentNetworkConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { USER_EVENT, PPN_INIT_EVENT, WALLET_CREATE_EVENT, WALLET_BACKUP_EVENT } from 'constants/userEventsConstants';
import { BADGE_REWARD_EVENT } from 'constants/badgesConstants';
import { SET_SMART_WALLET_ACCOUNT_ENS, SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';

// selectors
import { activeAccountAddressSelector, supportedAssetsSelector, bitcoinAddressSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';
import { activeBlockchainSelector } from 'selectors/selectors';

// types
import type { Asset } from 'models/Asset';
import type { ContactSmartAddressData, ApiUser } from 'models/Contacts';
import type { Theme } from 'models/Theme';
import type { RootReducerState } from 'reducers/rootReducer';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';


type Props = {
  type?: string,
  asset?: string,
  isPending?: boolean,
  supportedAssets: Asset[],
  selectEvent: Function,
  contacts: ApiUser[],
  contactsSmartAddresses: ContactSmartAddressData[],
  ensRegistry: EnsRegistry,
  theme: Theme,
  event: Object,
  feedType?: string,
  assets: Asset[],
  acceptInvitation: Function,
  rejectInvitation: Function,
  activeAccountAddress: string,
  activeBlockchainNetwork: string,
  accounts: Accounts,
  smartWalletState: Object,
};

type EventData = {
  label?: string,
  itemImageSource?: string,
  actionLabel?: ?string,
  badge?: ?string,
  subtext?: string,
  labelAsButton?: boolean,
  rejectInvitation?: Function,
  acceptInvitation?: Function,
  avatarUrl?: string,
  itemImageUrl?: string,
  iconName?: ?string,
  iconColor?: string,
  itemValue?: string,
  valueColor?: string,
  customAddon?: React.Node,
  itemStatusIcon?: string,
  eventData?: Object,
  eventType?: string,
  eventStatus?: string,
  iconBackgroundColor?: string,
  iconBorder?: boolean,
  fallbackToGenericToken?: boolean,
};

const PPNIcon = require('assets/icons/icon_PPN.png');
const keyWalletIcon = require('assets/icons/icon_ethereum_network.png');
const smartWalletIcon = require('assets/icons/icon_smart_wallet.png');

const NAMES = {
  SMART_WALLET: 'Smart wallet',
  KEY_WALLET: 'Key wallet',
  PPN_NETWORK: 'Pillar Network',
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

const elipsizeAddress = (address: string) => {
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
};

export class ActivityFeedItem extends React.Component<Props> {
  isReceived = ({ to: address }: Object) => {
    const { activeAccountAddress } = this.props;
    return addressesEqual(address, activeAccountAddress);
  }

  getContact = (event: Object) => {
    const { contacts } = this.props;
    const address = this.isReceived(event) ? event.from : event.to;
    return contacts.find(({ ethAddress }) => addressesEqual(address, ethAddress));
  }

  getMatchingContact = (event: Object) => {
    const { contacts, contactsSmartAddresses } = this.props;
    const address = this.isReceived(event) ? event.from : event.to;
    return findMatchingContact(address, contacts, contactsSmartAddresses) || {};
  }

  usernameOrAddress = (event: Object) => {
    if (event.username) {
      return event.username;
    }
    const contact = this.getContact(event);
    if (contact) {
      return contact.username;
    }
    const address = this.isReceived(event) ? event.from : event.to;
    return elipsizeAddress(address);
  }

  needToActivateSW = () => {
    const { accounts, smartWalletState } = this.props;
    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    return (smartWalletStatus.status !== SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE);
  }

  isSWAddress = (address: string) => {
    const account = findAccountByAddress(address, this.props.accounts);
    return (account && checkIfSmartWalletAccount(account));
  }

  isKWAddress = (address: string) => {
    const account = findAccountByAddress(address, this.props.accounts);
    return (account && checkIfKeyBasedAccount(account));
  }

  getFormattedSettleValues = () => {
    const {
      event,
      asset,
      assets,
      supportedAssets,
    } = this.props;
    const settleData = event.extra;
    const ppnTransactions = asset
      ? settleData.filter(({ symbol }) => symbol === asset)
      : settleData;

    const valueByAsset: Object = {};

    ppnTransactions.forEach((trx) => {
      const { symbol, value: rawValue } = trx;
      const { decimals = 18 } = getAssetData(assets, supportedAssets, symbol);
      const value = new BigNumber(rawValue);
      if (!valueByAsset[symbol]) {
        valueByAsset[symbol] = { ...trx, value, decimals };
      } else {
        const { value: currentValue } = valueByAsset[symbol];
        valueByAsset[symbol].value = currentValue.plus(value);
      }
    });

    const valuesArray = (Object.values(valueByAsset): any);
    const formattedValuesArray: Object[] = valuesArray.map(({ symbol, value, decimals }): Object => ({
      formatted: formatAmount(formatUnits(value.toString(), decimals)),
      symbol,
    }));
    return formattedValuesArray;
  }

  getWalletCreatedEventData = (event: Object) => {
    switch (event.eventTitle) {
      case 'Wallet created':
        return {
          label: NAMES.KEY_WALLET,
          itemImageSource: keyWalletIcon,
          actionLabel: STATUSES.CREATED,
        };
      case 'Smart wallet created':
        return {
          label: NAMES.SMART_WALLET,
          itemImageSource: smartWalletIcon,
          actionLabel: STATUSES.CREATED,
          badge: this.needToActivateSW() ? 'Need to activate' : null,
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
  }

  getUserEventData = (event: Object) => {
    switch (event.subType) {
      case WALLET_CREATE_EVENT:
        return this.getWalletCreatedEventData(event);
      case PPN_INIT_EVENT:
        return {
          label: NAMES.PPN_NETWORK,
          itemImageSource: PPNIcon,
          actionLabel: STATUSES.CREATED,
          badge: this.needToActivateSW() ? 'Need to activate' : null,
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
      assets, supportedAssets, ensRegistry, activeBlockchainNetwork,
    } = this.props;
    const isReceived = this.isReceived(event);
    const { decimals = 18 } = getAssetData(assets, supportedAssets, event.asset);
    const value = formatUnits(event.value, decimals);
    const contact = this.getMatchingContact(event);
    const avatarUrl = contact && contact.profileImage;

    const formattedValue = formatAmount(value);
    const directionIcon = isReceived ? 'received' : 'sent';
    let directionSymbol = isReceived ? '+' : '-';

    if (formattedValue === '0') {
      directionSymbol = '';
    }

    let data: EventData = {};
    const trxData = {};

    switch (event.tag) {
      case PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT:
        data = {
          label: NAMES.SMART_WALLET,
          itemImageSource: smartWalletIcon,
          actionLabel: STATUSES.ACTIVATED,
        };
        trxData.hideSender = true;
        trxData.hideAmount = true;
        trxData.txType = 'Deployment';
        break;
      case PAYMENT_NETWORK_ACCOUNT_TOPUP:
        if (activeBlockchainNetwork === BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK) {
          data = {
            label: NAMES.PPN_NETWORK,
            itemImageSource: PPNIcon,
            subtext: 'Top Up',
            itemValue: `+ ${formattedValue} ${event.asset}`,
            valueColor: 'positive',
          };
        } else {
          data = {
            label: NAMES.PPN_NETWORK,
            subtext: 'from Smart Wallet',
            iconName: 'sent',
            iconColor: 'negative',
            iconBackgroundColor: 'iconBackground',
            itemValue: `- ${formattedValue} ${event.asset}`,
            valueColor: 'text',
          };
        }
        trxData.hideSender = true;
        trxData.hideAmount = true;
        trxData.txType = 'PLR Tank Top Up';
        break;
      case SET_SMART_WALLET_ACCOUNT_ENS:
        data = {
          label: NAMES.SMART_WALLET,
          itemImageSource: smartWalletIcon,
          subtext: 'Register ENS label',
        };
        trxData.hideSender = true;
        trxData.hideAmount = true;
        trxData.txType = 'Register ENS label';
        break;
      case PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL:
        data = {
          label: NAMES.PPN_NETWORK,
          itemImageSource: PPNIcon,
          subtext: 'Withdrawal',
          itemValue: `- ${formattedValue} ${event.asset}`,
          valueColor: 'text',
        };
        trxData.txType = 'Withdrawal';
        trxData.hideAmount = true;
        trxData.hideSender = true;
        break;
      case PAYMENT_NETWORK_TX_SETTLEMENT:
        const formattedValuesArray = this.getFormattedSettleValues();
        data = {
          label: 'Settle',
          itemImageSource: PPNIcon,
          subtext: 'to Smart Wallet',
          customAddon: (
            <ListWrapper>
              {formattedValuesArray.map(({ formatted, symbol }) => (
                <TankAssetBalance
                  key={symbol}
                  amount={`- ${formatted} ${symbol}`}
                  monoColor
                />
              ))}
              {formattedValuesArray.map(({ formatted, symbol }) =>
                <ItemValue key={symbol}>{`+ ${formatted} ${symbol}`}</ItemValue>,
              )}
            </ListWrapper>),
        };
        break;
      default:
        const address = isReceived ? event.from : event.to;
        const usernameOrAddress = event.username
            || ensRegistry[address]
            || elipsizeAddress(address);
        const isPPNTransaction = get(event, 'isPPNTransaction', false);
        let subtext = event.accountType === ACCOUNT_TYPES.KEY_BASED ? 'Key wallet' : 'Smart wallet';
        if (isReceived && this.isSWAddress(event.from) && this.isKWAddress(event.to)) {
          subtext = 'to Key Wallet';
        } else if (isReceived && this.isKWAddress(event.from) && this.isSWAddress(event.to)) {
          subtext = 'to Smart Wallet';
        } else if (!isReceived && this.isSWAddress(event.from) && this.isKWAddress(event.to)) {
          subtext = 'from Smart Wallet';
        } else if (!isReceived && this.isKWAddress(event.from) && this.isSWAddress(event.to)) {
          subtext = 'from Key Wallet';
        }

        if (isPPNTransaction) {
          data = {
            label: usernameOrAddress,
            avatarUrl,
            customAddon: (
              <TankAssetBalance
                amount={`${directionSymbol} ${formattedValue} ${event.asset}`}
              />
            ),
          };
        } else {
          data = {
            label: usernameOrAddress,
            subtext,
            avatarUrl,
            iconName: !avatarUrl ? directionIcon : null,
            iconColor: isReceived ? 'transactionReceivedIcon' : 'negative',
            itemValue: `${directionSymbol} ${formattedValue} ${event.asset}`,
            valueColor: isReceived && formattedValue !== '0' ? 'positive' : 'text',
            iconBackgroundColor: 'iconBackground',
          };
        }
    }
    data.itemStatusIcon = event.status === TX_PENDING_STATUS ? TX_PENDING_STATUS : '';
    if (activeBlockchainNetwork === 'BITCOIN') {
      data.subtext = 'Bitcoin wallet';
    }
    data.eventData = {
      ...event,
      value,
      contact,
      ...trxData,
    };
    return data;
  }

  getCollectibleTransactionEventData = (event: Object) => {
    const isReceived = this.isReceived(event);
    const { asset, icon } = event;
    const usernameOrAddress = this.usernameOrAddress(event);
    const subtext = `Collectible ${isReceived ? 'from' : 'to'} ${usernameOrAddress}`;
    const contact = this.getContact(event);

    return {
      label: asset,
      itemImageUrl: icon,
      subtext,
      actionLabel: isReceived ? STATUSES.RECEIVED : STATUSES.SENT,
      eventData: { ...event, contact },
      iconBackgroundColor: 'card',
      iconBorder: true,
      fallbackToGenericToken: true,
    };
  }

  getBadgeRewardEventData = (event: Object): EventData => {
    const { name, imageUrl } = event;
    return {
      label: name,
      itemImageUrl: imageUrl,
      subtext: 'Badge',
      actionLabel: STATUSES.RECEIVED,
      eventData: { ...event },
    };
  }

  getSocialEventData = (event: Object): ?EventData => {
    const { rejectInvitation, acceptInvitation } = this.props;
    const { type, username, profileImage } = event;

    let actionLabel;
    if (type === TYPE_ACCEPTED) {
      actionLabel = STATUSES.CONNECTED;
    } else if (type === TYPE_SENT) {
      actionLabel = STATUSES.REQUESTED;
    } else {
      actionLabel = null;
    }

    const data: EventData = {
      label: username,
      actionLabel,
      avatarUrl: profileImage,
      eventData: { ...event },
      eventType: CONNECTION_EVENT,
      eventStatus: event.type,
      labelAsButton: type === TYPE_SENT,
    };

    if (type === TYPE_RECEIVED) {
      data.subtext = 'Connection request';
      data.rejectInvitation = () => createAlert(TYPE_REJECTED, event, () => rejectInvitation(event));
      data.acceptInvitation = () => acceptInvitation(event);
    }

    return data;
  }

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
  }

  getColor = (color: ?string): ?string => {
    if (!color) return null;
    const { theme } = this.props;
    const colors = getThemeColors(theme);
    return colors[color] || color;
  }

  render() {
    const { event, selectEvent } = this.props;
    const itemData = this.getEventData(event);
    if (!itemData) return null;

    const {
      iconColor,
      valueColor,
      eventData,
      eventType,
      eventStatus,
      iconBackgroundColor,
    } = itemData;

    return (
      <ListItemWithImage
        {...itemData}
        onPress={eventData && (() => selectEvent(eventData, eventType || event.type, eventStatus || event.status))}
        actionLabelColor={this.getColor('secondaryText')}
        iconColor={this.getColor(iconColor)}
        diameter={48}
        iconBackgroundColor={this.getColor(iconBackgroundColor)}
        valueColor={this.getColor(valueColor)}
      />
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
  ensRegistry: { data: ensRegistry },
  smartWallet: smartWalletState,
  accounts: { data: accounts },
}: RootReducerState): $Shape<Props> => ({
  contacts,
  contactsSmartAddresses,
  ensRegistry,
  smartWalletState,
  accounts,
});

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
  assets: (state) => getAssetsAsList(accountAssetsSelector(state)),
  supportedAssets: supportedAssetsSelector,
  bitcoinAddresses: bitcoinAddressSelector,
  activeBlockchainNetwork: activeBlockchainSelector,
});

const combinedMapStateToProps = (state: RootReducerState) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default withTheme(connect(combinedMapStateToProps)(ActivityFeedItem));
