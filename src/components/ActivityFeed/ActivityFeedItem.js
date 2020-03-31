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
import { withTheme } from 'styled-components/native';

// utils
import { getThemeColors } from 'utils/themes';
import { addressesEqual, getAssetData, getAssetsAsList } from 'utils/assets';
import { createAlert } from 'utils/alerts';
import { findMatchingContact } from 'utils/contacts';

// components
import {
  formatAmount,
  formatUnits,
} from 'utils/common';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import TankAssetBalance from 'components/TankAssetBalance';

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
import { SET_SMART_WALLET_ACCOUNT_ENS } from 'constants/smartWalletConstants';
import { SettlementItem } from 'components/ActivityFeed/SettlementItem';

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
  onAcceptInvitation: Function,
  onRejectInvitation: Function,
  activeAccountAddress: string,
  activeBlockchainNetwork: string,
};

type EventData = {
  name?: string,
  icon?: string,
  status?: ?string,
  statusColor?: string,
  badge?: string,
  information?: string,
  statusAsButton?: boolean,
  rejectInvitation?: Function,
  acceptInvitation?: Function,
  avatarUrl?: string,
  imageUrl?: string,
  iconName?: ?string,
  iconColor?: string,
  itemValue?: string,
  valueColor?: string,
  customAddon?: React.Node,
  statusIcon?: string,
  eventData?: Object,
  eventType?: string,
  eventStatus?: string,
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
};

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
    const contact = this.getContact(event);
    if (contact) {
      return contact.username;
    }
    const address = this.isReceived(event) ? event.from : event.to;
    return elipsizeAddress(address);
  }

  getWalletCreatedEventData = (event: Object) => {
    switch (event.eventTitle) {
      case 'Wallet created':
        return {
          name: NAMES.KEY_WALLET,
          icon: keyWalletIcon,
          status: STATUSES.CREATED,
          statusColor: 'positive',
        };
      case 'Smart wallet created':
        return {
          name: NAMES.SMART_WALLET,
          icon: smartWalletIcon,
          status: STATUSES.CREATED,
          statusColor: 'positive',
          badge: 'Need to activate',
        };
      case 'Wallet imported':
        return {
          name: NAMES.KEY_WALLET,
          icon: keyWalletIcon,
          status: 'Imported',
          statusColor: 'positive',
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
          name: NAMES.PPN_NETWORK,
          icon: PPNIcon,
          status: STATUSES.CREATED,
          statusColor: 'positive',
          badge: 'Need to activate',
        };
      case WALLET_BACKUP_EVENT:
        return {
          name: NAMES.KEY_WALLET,
          icon: keyWalletIcon,
          status: STATUSES.BACKUP,
          statusColor: 'secondaryText',
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
          name: NAMES.SMART_WALLET,
          icon: smartWalletIcon,
          information: 'Activation',
          itemValue: `${directionSymbol} ${formattedValue} ${event.asset}`,
          valueColor: 'text',
        };
        trxData.hideSender = true;
        trxData.hideAmount = true;
        trxData.txType = 'Deployment';
        break;
      case PAYMENT_NETWORK_ACCOUNT_TOPUP:
        data = {
          name: NAMES.PPN_NETWORK,
          icon: PPNIcon,
          information: 'Top Up',
          itemValue: `+ ${formattedValue} ${event.asset}`,
          valueColor: 'positive',
        };
        trxData.hideSender = true;
        trxData.hideAmount = true;
        trxData.txType = 'PLR Tank Top Up';
        break;
      case SET_SMART_WALLET_ACCOUNT_ENS:
        data = {
          name: NAMES.SMART_WALLET,
          icon: smartWalletIcon,
          information: 'Register ENS name',
        };
        trxData.hideSender = true;
        trxData.hideAmount = true;
        trxData.txType = 'Register ENS name';
        break;
      case PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL:
        data = {
          name: NAMES.PPN_NETWORK,
          icon: PPNIcon,
          information: 'Withdrawal',
          itemValue: `- ${formattedValue} ${event.asset}`,
          valueColor: 'text',
        };
        trxData.txType = 'Withdrawal';
        trxData.hideAmount = true;
        trxData.hideSender = true;
        break;
      default:
        const address = isReceived ? event.from : event.to;
        const usernameOrAddress = event.username
            || ensRegistry[address]
            || elipsizeAddress(address);
        const isPPNTransaction = get(event, 'isPPNTransaction', false);
        const information = event.accountType === ACCOUNT_TYPES.KEY_BASED ? 'Key wallet' : 'Smart wallet';
        if (isPPNTransaction) {
          data = {
            name: usernameOrAddress,
            avatarUrl,
            customAddon: (
              <TankAssetBalance
                amount={`${directionSymbol} ${formattedValue} ${event.asset}`}
              />
            ),
          };
        } else {
          data = {
            name: usernameOrAddress,
            information,
            avatarUrl,
            iconName: !avatarUrl ? directionIcon : null,
            iconColor: isReceived ? 'transactionReceivedIcon' : 'negative',
            itemValue: `${directionSymbol} ${formattedValue} ${event.asset}`,
            valueColor: isReceived && formattedValue !== '0' ? 'positive' : 'text',
          };
        }
    }
    data.statusIcon = event.status === TX_PENDING_STATUS ? TX_PENDING_STATUS : '';
    if (activeBlockchainNetwork === 'BITCOIN') {
      data.information = 'Bitcoin wallet';
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
    const information = `Collectible ${isReceived ? 'from' : 'to'} ${usernameOrAddress}`;
    const contact = this.getContact(event);

    return {
      name: asset,
      imageUrl: icon,
      information,
      status: isReceived ? STATUSES.RECEIVED : STATUSES.SENT,
      statusColor: isReceived ? 'positive' : 'text',
      eventData: { ...event, contact },
    };
  }

  getBadgeRewardEventData = (event: Object): EventData => {
    const { name, imageUrl } = event;
    return {
      name,
      imageUrl,
      information: 'Badge',
      status: STATUSES.RECEIVED,
      statusColor: 'positive',
      eventData: { ...event },
    };
  }

  getSocialEventData = (event: Object): ?EventData => {
    const { onRejectInvitation, onAcceptInvitation } = this.props;
    const { type, username, profileImage } = event;

    let status;
    if (type === TYPE_ACCEPTED) {
      status = STATUSES.CONNECTED;
    } else if (type === TYPE_SENT) {
      status = STATUSES.REQUESTED;
    } else {
      status = null;
    }

    const data: EventData = {
      name: username,
      status,
      avatarUrl: profileImage,
      eventData: { ...event },
      eventType: CONNECTION_EVENT,
      eventStatus: event.type,
      statusAsButton: type === TYPE_SENT,
    };

    if (type === TYPE_RECEIVED) {
      data.information = 'Connection request';
      data.rejectInvitation = () => createAlert(TYPE_REJECTED, event, () => onRejectInvitation(event));
      data.acceptInvitation = () => onAcceptInvitation(event);
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

  renderSettlement = (event: Object) => {
    const {
      assets, supportedAssets, asset, feedType, contacts, contactsSmartAddresses, selectEvent,
    } = this.props;
    const { type } = event;
    const trxData = {
      hideAmount: true,
      hideSender: true,
      txType: 'PLR Network settle',
    };

    const address = this.isReceived(event) ? event.from : event.to;
    const contact = findMatchingContact(address, contacts, contactsSmartAddresses) || {};
    const { decimals = 18 } = getAssetData(assets, supportedAssets, event.asset);
    const value = formatUnits(event.value, decimals);

    return (
      <SettlementItem
        settleData={event.extra}
        onPress={() => selectEvent({
          ...event,
          value,
          contact,
          ...trxData,
        }, type, event)}
        type={feedType}
        asset={asset}
        isPending={event === TX_PENDING_STATUS}
        supportedAssets={supportedAssets}
        accountAssets={assets}
      />
    );
  }

  getColor = (color: ?string): ?string => {
    if (!color) return null;
    const { theme } = this.props;
    const colors = getThemeColors(theme);
    return colors[color] || color;
  }

  render() {
    const { event, selectEvent } = this.props;

    if (event.type === TRANSACTION_EVENT && event.tag === PAYMENT_NETWORK_TX_SETTLEMENT) {
      return this.renderSettlement(event);
    }

    const itemData = this.getEventData(event);

    if (!itemData) return null;

    const {
      name,
      icon,
      status,
      statusColor,
      badge,
      information,
      statusAsButton,
      rejectInvitation,
      acceptInvitation,
      avatarUrl,
      imageUrl,
      iconName,
      iconColor,
      itemValue,
      valueColor,
      customAddon,
      statusIcon,
      eventData,
      eventType,
      eventStatus,
    } = itemData;

    return (
      <ListItemWithImage
        label={name}
        subtext={information}
        onPress={eventData && (() => selectEvent(eventData, eventType || event.type, eventStatus || event.status))}
        badge={badge}
        actionLabel={status}
        actionLabelColor={this.getColor(statusColor)}
        labelAsButton={statusAsButton}
        rejectInvitation={rejectInvitation}
        acceptInvitation={acceptInvitation}
        itemImageSource={icon}
        avatarUrl={avatarUrl}
        itemImageUrl={imageUrl}
        iconName={iconName}
        iconColor={this.getColor(iconColor)}
        diameter={48}
        iconBackgroundColor={this.getColor('iconBackground')}
        itemValue={itemValue}
        valueColor={this.getColor(valueColor)}
        customAddon={customAddon}
        itemStatusIcon={statusIcon}
      />
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
  ensRegistry: { data: ensRegistry },
}: RootReducerState): $Shape<Props> => ({
  contacts,
  contactsSmartAddresses,
  ensRegistry,
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
