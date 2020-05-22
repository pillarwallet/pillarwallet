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
import { storiesOf } from '@storybook/react-native';
import { EventDetail as EventDetailsClass } from 'components/EventDetails';
import { noop } from 'utils/common';
import { withTheme } from 'styled-components/native';

import { PPN_INIT_EVENT, USER_EVENT, WALLET_BACKUP_EVENT, WALLET_CREATE_EVENT } from 'constants/userEventsConstants';
import {
  PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT,
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_TX_SETTLEMENT,
} from 'constants/paymentNetworkConstants';
import { TRANSACTION_EVENT, TX_PENDING_STATUS } from 'constants/historyConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';


const placeholderImage = 'https://picsum.photos/200';

const reduxData = {
  contacts: [{
    username: 'alexander', ethAddress: '0xContact', profileImage: placeholderImage, connectionKey: '', id: '',
  }],
  contactsSmartAddresses: [{
    userId: '38dc5545-825a-4a37-ae47-875d8287a9c4',
    smartWallets: [
      '0x8Cc0Ff0F2c2466735C4E4c71A7EA7B94b6900BF5',
    ],
  }],
  assetDecimals: 18,
  ensRegistry: {
    '0x111111': 'john',
  },
  activeAccountAddress: '',
  activeBlockchainNetwork: '',
  isSmartWalletActivated: true,
  bitcoinAddresses: [{
    address: 'bitcoinAddress',
    updatedAt: 0,
  }],
  accounts: [
    {
      id: '0xKeyWallet',
      type: 'KEY_BASED',
      walletId: '350145cb-b266-488e-8dda-c89d77034226',
      isActive: true,
    },
    {
      id: '0xSmartWallet',
      type: 'SMART_WALLET',
      walletId: 'f13c646b-435c-4bbc-ab08-4121b7319333',
      isActive: false,
      extra:
        {
          ensName: null,
          address: '0xDb5Da19Bcf2754Acc9f706E4e75b9666D2097199',
        },
    },
  ],
  rates: {},
  baseFiatCurrency: '',
  user: {},
  supportedAssets: [],
  PPNTransactions: [],
  mergedPPNTransactions: [
    {
      asset: 'PLR',
      value: '1000000000000000000',
      hash: '0xHash1',
    }, {
      asset: 'ETH',
      value: '2000000000000000000',
      hash: '0xHash2',
    },
  ],
  accountAssets: [],
  isPPNActivated: true,
  history: [],
};

const actions = {
  switchAccount: noop,
  goToInvitationFlow: noop,
  updateTransactionStatus: noop,
  lookupAddress: noop,
};

const commonProps = {
  isVisible: true,
  onClose: noop,
  rejectInvitation: noop,
  acceptInvitation: noop,
  isForAllAccounts: true,
  navigation: {
    navigate: noop(),
  },
  storybook: true,
};


const keyWalletIcon = require('assets/icons/icon_key_wallet.png');
const smartWalletIcon = require('assets/icons/icon_smart_wallet.png');
const PPNIcon = require('assets/icons/icon_PPN.png');

const EventDetailsStoryItem = withTheme(EventDetailsClass);

storiesOf('EventDetail', module)
// SMART WALLET (and related) EVENTS
  .add('Smart wallet created | Needs to activate', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      isSmartWalletActivated={false}
      event={{ type: USER_EVENT, subType: WALLET_CREATE_EVENT, eventTitle: 'Smart Wallet created' }}
      itemData={{
        label: 'Smart wallet',
        itemImageSource: smartWalletIcon,
        actionLabel: 'Created',
      }}
    />
  ))
  .add('Smart wallet activated | Needs to activate PPN', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      isPPNActivated={false}
      event={{ type: TRANSACTION_EVENT, tag: PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT }}
      itemData={{
        label: 'Smart wallet',
        itemImageSource: smartWalletIcon,
        actionLabel: 'Created',
      }}
    />
  ))
  .add('Smart wallet activated', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{ type: TRANSACTION_EVENT, tag: PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT }}
      itemData={{
        label: 'Smart wallet',
        itemImageSource: smartWalletIcon,
        actionLabel: 'Created',
      }}
    />
  ))
  .add('Smart Wallet Top up | KW -> SW', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        from: '0xKeyWallet',
        to: '0xSmartWallet',
      }}
      itemData={{
        label: 'Key wallet',
        itemValue: '- 10 PLR',
        itemImageSource: keyWalletIcon,
        subtext: 'to Smart Wallet',
        isBetweenAccounts: true,
        valueColor: 'text',
      }}
    />
  ))
  .add('Smart Wallet Top up | SW <- KW', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        from: '0xKeyWallet',
        to: '0xSmartWallet',
      }}
      itemData={{
        label: 'Smart Wallet',
        itemValue: '+ 10 PLR',
        itemImageSource: smartWalletIcon,
        subtext: 'from Key wallet',
        isBetweenAccounts: true,
        valueColor: 'positive',
        isReceived: true,
      }}
    />
  ))
  .add('Smart Wallet Incoming Non-contact', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        from: '0x123456789123456789123456789',
        to: '0xSmartWallet',
      }}
      itemData={{
        label: '0x1234567...132456789',
        itemValue: '+ 10 PLR',
        subtext: 'to Smart wallet',
        avatarUrl: '',
        iconName: 'received',
        iconColor: 'transactionReceivedIcon',
        valueColor: 'positive',
        isReceived: true,
      }}
    />
  ))
  .add('Smart Wallet Incoming Non-contact (Pending)', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        from: '0x123456789123456789123456789',
        to: '0xSmartWallet',
        status: TX_PENDING_STATUS,
      }}
      itemData={{
        label: '0x1234567...132456789',
        itemValue: '+ 10 PLR',
        subtext: 'to Smart wallet',
        avatarUrl: '',
        iconName: 'received',
        iconColor: 'transactionReceivedIcon',
        valueColor: 'positive',
        isReceived: true,
      }}
    />
  ))
  .add('Smart Wallet Incoming Contact', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        from: '0xContact',
        to: '0xSmartWallet',
      }}
      itemData={{
        label: 'alexander',
        itemValue: '+ 10 PLR',
        subtext: 'to Smart wallet',
        avatarUrl: placeholderImage,
        iconName: null,
        iconColor: 'transactionReceivedIcon',
        valueColor: 'positive',
        isReceived: true,
      }}
    />
  ))
  .add('Smart Wallet Incoming Contact (Pending)', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        from: '0xContact',
        to: '0xSmartWallet',
        status: TX_PENDING_STATUS,
      }}
      itemData={{
        label: 'alexander',
        itemValue: '+ 10 PLR',
        subtext: 'to Smart wallet',
        avatarUrl: placeholderImage,
        iconName: null,
        iconColor: 'transactionReceivedIcon',
        valueColor: 'positive',
        isReceived: true,
      }}
    />
  ))
  .add('Smart Wallet Outgoing Non-contact', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        from: '0xSmartWallet',
        to: '0x123456789123456789123456789',
      }}
      itemData={{
        label: '0x1234567...132456789',
        itemValue: '- 10 PLR',
        subtext: 'from Smart wallet',
        avatarUrl: '',
        iconName: 'sent',
        iconColor: 'negative',
        valueColor: 'text',
      }}
    />
  ))
  .add('Smart Wallet Outgoing Non-contact (Pending)', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        from: '0xSmartWallet',
        to: '0x123456789123456789123456789',
        status: TX_PENDING_STATUS,
      }}
      itemData={{
        label: '0x1234567...132456789',
        itemValue: '- 10 PLR',
        subtext: 'from Smart wallet',
        avatarUrl: '',
        iconName: 'sent',
        iconColor: 'negative',
        valueColor: 'text',
      }}
    />
  ))
  .add('Smart Wallet Outgoing Contact', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        from: '0xSmartWallet',
        to: '0xContact',
      }}
      itemData={{
        label: 'alexander',
        itemValue: '- 10 PLR',
        subtext: 'from Smart wallet',
        avatarUrl: placeholderImage,
        iconName: null,
        iconColor: 'negative',
        valueColor: 'text',
      }}
    />
  ))
  .add('Smart Wallet Outgoing Contact (Pending)', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        from: '0xSmartWallet',
        to: '0xContact',
        status: TX_PENDING_STATUS,
      }}
      itemData={{
        label: 'alexander',
        itemValue: '- 10 PLR',
        subtext: 'from Smart wallet',
        avatarUrl: placeholderImage,
        iconName: null,
        iconColor: 'negative',
        valueColor: 'text',
      }}
    />
  ))

// KEY WALLET (and related) EVENTS
  .add('Key wallet created', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{ type: USER_EVENT, subType: WALLET_CREATE_EVENT, eventTitle: 'Wallet created' }}
      itemData={{
        label: 'Key wallet',
        itemImageSource: keyWalletIcon,
        actionLabel: 'Created',
      }}
    />
  ))
  .add('Key wallet imported', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{ type: USER_EVENT, subType: WALLET_CREATE_EVENT, eventTitle: 'Wallet imported' }}
      itemData={{
        label: 'Key wallet',
        itemImageSource: keyWalletIcon,
        actionLabel: 'Backup secured',
      }}
    />
  ))
  .add('Key wallet back up', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{ type: USER_EVENT, subType: WALLET_BACKUP_EVENT }}
      itemData={{
        label: 'Key wallet',
        itemImageSource: keyWalletIcon,
        actionLabel: 'Imported',
      }}
    />
  ))
  .add('Key wallet Incoming Non-contact', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        from: '0x123456789123456789123456789',
        to: 'KeyWallet',
      }}
      itemData={{
        label: '0x1234567...132456789',
        itemValue: '+ 10 PLR',
        subtext: 'to Key wallet',
        avatarUrl: '',
        iconName: 'received',
        iconColor: 'transactionReceivedIcon',
        valueColor: 'positive',
        isReceived: true,
      }}
    />
  ))
  .add('Key wallet Incoming Contact', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        from: '0xContact',
        to: '0xKeyWallet',
      }}
      itemData={{
        label: 'alexander',
        itemValue: '+ 10 PLR',
        subtext: 'to Key wallet',
        avatarUrl: placeholderImage,
        iconName: null,
        iconColor: 'transactionReceivedIcon',
        valueColor: 'positive',
        isReceived: true,
      }}
    />
  ))
  .add('Key wallet Outgoing Non-contact', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        from: '0xKeyWallet',
        to: '0x123456789123456789123456789',
      }}
      itemData={{
        label: '0x1234567...132456789',
        itemValue: '- 10 PLR',
        subtext: 'from Key wallet',
        avatarUrl: '',
        iconName: 'sent',
        iconColor: 'negative',
        valueColor: 'text',
      }}
    />
  ))
  .add('Key Wallet Top up | SW -> KW', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        from: '0xSmartWallet',
        to: '0xKeyWallet',
      }}
      itemData={{
        label: 'Smart wallet',
        itemValue: '- 10 PLR',
        itemImageSource: smartWalletIcon,
        subtext: 'to Key wallet',
        isBetweenAccounts: true,
        valueColor: 'text',
      }}
    />
  ))
  .add('Key Wallet Top up | KW <- SW', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        from: '0xSmartWallet',
        to: '0xKeyWallet',
      }}
      itemData={{
        label: 'Key wallet',
        itemValue: '+ 10 PLR',
        itemImageSource: keyWalletIcon,
        subtext: 'from Smart wallet',
        isBetweenAccounts: true,
        isReceived: true,
        valueColor: 'positive',
      }}
    />
  ))
  .add('Key Wallet Collectible from SW', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: COLLECTIBLE_TRANSACTION,
        from: '0xSmartWallet',
        to: '0xKeyWallet',
      }}
      itemData={{
        label: 'CryptoKitty',
        itemImageUrl: placeholderImage,
        subtext: 'Collectible from Smart Wallet',
        actionLabel: 'Received',
        iconBackgroundColor: 'card',
        iconBorder: true,
        fallbackToGenericToken: true,
        isReceived: true,
        isBetweenAccounts: true,
      }}
    />
  ))

// PPN (and related) EVENTS
  .add('Pillar Network Created', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{ type: USER_EVENT, subType: PPN_INIT_EVENT }}
      itemData={{
        label: 'Pillar Network',
        itemImageSource: PPNIcon,
        actionLabel: 'Created',
        badge: 'Need to activate',
      }}
      isPPNActivated={false}
    />
  ))
  .add('Pillar Network Activated', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{ type: USER_EVENT, subType: PPN_INIT_EVENT }}
      itemData={{
        label: 'Pillar Network',
        itemImageSource: PPNIcon,
        actionLabel: 'Created',
      }}
    />
  ))
  .add('Pillar Network Top Up (PPN <- SW)', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{ type: TRANSACTION_EVENT, tag: PAYMENT_NETWORK_ACCOUNT_TOPUP }}
      itemData={{
        label: 'Pillar Network',
        itemImageSource: PPNIcon,
        itemValue: '+ 10 PLR',
        subtext: 'from Smart Wallet',
        valueColor: 'positive',
      }}
    />
  ))
  .add('Pillar Network Top Up (SW -> PPN)', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{ type: TRANSACTION_EVENT, tag: PAYMENT_NETWORK_ACCOUNT_TOPUP }}
      itemData={{
        label: 'Smart Wallet',
        itemImageSource: smartWalletIcon,
        itemValue: '- 10 PLR',
        subtext: 'to Pillar Network',
        valueColor: 'text',
      }}
    />
  ))
  .add('Pillar Network Received', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        isPPNTransaction: true,
        from: '0xContact',
        to: '0xSmartWallet',
        asset: 'PLR',
        value: '1000000000000000000',
      }}
      itemData={{
        label: 'alexander',
        avatarUrl: placeholderImage,
        isReceived: true,
      }}
    />
  ))
  .add('Pillar Network Sent', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        isPPNTransaction: true,
        from: '0xSmartWallet',
        to: '0xContact',
        asset: 'PLR',
        value: '1000000000000000000',
      }}
      itemData={{
        label: 'alexander',
        avatarUrl: placeholderImage,
      }}
    />
  ))
  .add('Pillar Network Settle (PPN <-> SW)', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        tag: PAYMENT_NETWORK_TX_SETTLEMENT,
        extra: [{
          symbol: 'PLR',
          value: '1000000000000000000',
          hash: '0xHash1',
        }, {
          symbol: 'ETH',
          value: '2000000000000000000',
          hash: '0xHash2',
        }],
      }}
      itemData={{
        label: 'Settle',
        itemImageSource: PPNIcon,
        subtext: 'to Smart Wallet',
      }}
    />
  ))
  .add('Pillar Network Withdrawal (PPN -> SW)', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        tag: PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
      }}
      itemData={{
        label: 'Pillar Network',
        itemImageSource: PPNIcon,
        itemValue: '- 10 PLR',
        subtext: 'to Smart Wallet',
        valueColor: 'text',
      }}
    />
  ))
  .add('Pillar Network Withdrawal (SW <- PPN)', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        tag: PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
      }}
      itemData={{
        label: 'Smart Wallet',
        itemImageSource: smartWalletIcon,
        itemValue: '+ 10 PLR',
        subtext: 'from Pillar Network',
        valueColor: 'positive',
      }}
    />
  ))

// BITCOIN WALLET
  .add('Bitcoin Wallet Incoming', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        from: 'someBitcoinAddress',
        to: 'bitcoinAddress',
      }}
      itemData={{
        label: 'someBitcoinAddress',
        itemValue: '+ 0.1 BTC',
        subtext: 'to Bitcoin Wallet',
        valueColor: 'positive',
        avatarUrl: '',
        iconName: 'received',
        iconColor: 'transactionReceivedIcon',
        isReceived: true,
      }}
    />
  ))
  .add('Bitcoin Wallet Outgoing', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        from: 'someBitcoinAddress',
        to: 'bitcoinAddress',
        asset: 'BTC',
        btcFee: 5915,
        nbConfirmations: 25,
        status: 'confirmed',
        isPPNTransaction: false,
      }}
      itemData={{
        label: 'someBitcoinAddress',
        itemValue: '- 0.1 BTC',
        subtext: 'from Bitcoin Wallet',
        valueColor: 'text',
        avatarUrl: '',
        iconName: 'sent',
        iconColor: 'negative',
      }}
      assetDecimals={8}
    />
  ));
