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
import {
  POOLTOGETHER_WITHDRAW_TRANSACTION,
  POOLTOGETHER_DEPOSIT_TRANSACTION,
} from 'constants/poolTogetherConstants';
import {
  LIQUIDITY_POOLS_ADD_LIQUIDITY_TRANSACTION,
  LIQUIDITY_POOLS_REMOVE_LIQUIDITY_TRANSACTION,
  LIQUIDITY_POOLS_STAKE_TRANSACTION,
  LIQUIDITY_POOLS_UNSTAKE_TRANSACTION,
  LIQUIDITY_POOLS_REWARDS_CLAIM_TRANSACTION,
  LIQUIDITY_POOLS,
} from 'constants/liquidityPoolsConstants';

import WithThemeDecorator from '../../../storybook/WithThemeDecorator';

const placeholderImage = 'https://picsum.photos/200';

const reduxData = {
  assetDecimals: 18,
  ensRegistry: {
    '0x111111': 'john',
  },
  activeAccountAddress: '',
  activeBlockchainNetwork: '',
  isSmartWalletActivated: true,
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
  supportedAssets: [
    { symbol: 'PLR', name: 'Pillar' },
    { symbol: 'ETH', name: 'Ethereum' },
  ],
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
  referralRewardIssuersAddresses: [],
  isPillarRewardCampaignActive: true,
  collectiblesHistory: [],
  isSmartAccount: true,
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
  isForAllAccounts: true,
  navigation: {
    navigate: noop(),
  },
};


const keyWalletIcon = require('assets/icons/icon_key_wallet.png');
const smartWalletIcon = require('assets/icons/icon_smart_wallet.png');
const PPNIcon = require('assets/icons/icon_PPN.png');
const poolTogetherLogo = require('assets/images/pool_together.png');
const daiIcon = require('assets/images/dai_color.png');
const usdcIcon = require('assets/images/usdc_color.png');

const EventDetailsStoryItem = withTheme(EventDetailsClass);

storiesOf('EventDetail', module)
// SMART WALLET (and related) EVENTS
  .addDecorator(WithThemeDecorator)
  .add('Smart wallet created | Needs to activate', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      isSmartWalletActivated={false}
      event={{
        type: USER_EVENT,
        subType: WALLET_CREATE_EVENT,
        eventTitle: 'Smart Wallet created',
        hash: '0xHash',
      }}
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
      event={{ type: TRANSACTION_EVENT, tag: PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT, hash: '0xHash' }}
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
      event={{ type: TRANSACTION_EVENT, tag: PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT, hash: '0xHash' }}
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
        hash: '0xHash',
      }}
      itemData={{
        label: 'Key wallet',
        fullItemValue: '- 10 PLR',
        itemImageSource: keyWalletIcon,
        subtext: 'to Smart Wallet',
        isBetweenAccounts: true,
        valueColor: 'basic010',
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
        hash: '0xHash',
      }}
      itemData={{
        label: 'Smart Wallet',
        fullItemValue: '+ 10 PLR',
        itemImageSource: smartWalletIcon,
        subtext: 'from Key wallet',
        isBetweenAccounts: true,
        valueColor: 'secondaryAccent140',
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
        hash: '0xHash',
      }}
      itemData={{
        label: '0x1234567...132456789',
        fullItemValue: '+ 10 PLR',
        subtext: 'to Smart wallet',
        avatarUrl: '',
        iconName: 'received',
        iconColor: 'transactionReceivedIcon',
        valueColor: 'secondaryAccent140',
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
        hash: '0xHash',
      }}
      itemData={{
        label: '0x1234567...132456789',
        fullItemValue: '+ 10 PLR',
        subtext: 'to Smart wallet',
        avatarUrl: '',
        iconName: 'received',
        iconColor: 'transactionReceivedIcon',
        valueColor: 'secondaryAccent140',
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
        hash: '0xHash',
      }}
      itemData={{
        label: 'alexander',
        fullItemValue: '+ 10 PLR',
        subtext: 'to Smart wallet',
        avatarUrl: placeholderImage,
        iconName: null,
        iconColor: 'transactionReceivedIcon',
        valueColor: 'secondaryAccent140',
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
        hash: '0xHash',
      }}
      itemData={{
        label: 'alexander',
        fullItemValue: '+ 10 PLR',
        subtext: 'to Smart wallet',
        avatarUrl: placeholderImage,
        iconName: null,
        iconColor: 'transactionReceivedIcon',
        valueColor: 'secondaryAccent140',
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
        hash: '0xHash',
      }}
      itemData={{
        label: '0x1234567...132456789',
        fullItemValue: '- 10 PLR',
        subtext: 'from Smart wallet',
        avatarUrl: '',
        iconName: 'sent',
        iconColor: 'negative',
        valueColor: 'basic010',
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
        hash: '0xHash',
      }}
      itemData={{
        label: '0x1234567...132456789',
        fullItemValue: '- 10 PLR',
        subtext: 'from Smart wallet',
        avatarUrl: '',
        iconName: 'sent',
        iconColor: 'negative',
        valueColor: 'basic010',
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
        hash: '0xHash',
      }}
      itemData={{
        label: 'alexander',
        fullItemValue: '- 10 PLR',
        subtext: 'from Smart wallet',
        avatarUrl: placeholderImage,
        iconName: null,
        iconColor: 'negative',
        valueColor: 'basic010',
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
        hash: '0xHash',
      }}
      itemData={{
        label: 'alexander',
        fullItemValue: '- 10 PLR',
        subtext: 'from Smart wallet',
        avatarUrl: placeholderImage,
        iconName: null,
        iconColor: 'negative',
        valueColor: 'basic010',
      }}
    />
  ))

// KEY WALLET (and related) EVENTS
  .add('Key wallet created', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: USER_EVENT,
        subType: WALLET_CREATE_EVENT,
        eventTitle: 'Wallet created',
        hash: '0xHash',
      }}
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
        hash: '0xHash',
      }}
      itemData={{
        label: '0x1234567...132456789',
        fullItemValue: '+ 10 PLR',
        subtext: 'to Key wallet',
        avatarUrl: '',
        iconName: 'received',
        iconColor: 'transactionReceivedIcon',
        valueColor: 'secondaryAccent140',
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
        hash: '0xHash',
      }}
      itemData={{
        label: 'alexander',
        fullItemValue: '+ 10 PLR',
        subtext: 'to Key wallet',
        avatarUrl: placeholderImage,
        iconName: null,
        iconColor: 'transactionReceivedIcon',
        valueColor: 'secondaryAccent140',
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
        hash: '0xHash',
      }}
      itemData={{
        label: '0x1234567...132456789',
        fullItemValue: '- 10 PLR',
        subtext: 'from Key wallet',
        avatarUrl: '',
        iconName: 'sent',
        iconColor: 'negative',
        valueColor: 'basic010',
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
        hash: '0xHash',
      }}
      itemData={{
        label: 'Smart wallet',
        fullItemValue: '- 10 PLR',
        itemImageSource: smartWalletIcon,
        subtext: 'to Key wallet',
        isBetweenAccounts: true,
        valueColor: 'basic010',
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
        hash: '0xHash',
      }}
      itemData={{
        label: 'Key wallet',
        fullItemValue: '+ 10 PLR',
        itemImageSource: keyWalletIcon,
        subtext: 'from Smart wallet',
        isBetweenAccounts: true,
        isReceived: true,
        valueColor: 'secondaryAccent140',
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
        hash: '0xHash',
      }}
      itemData={{
        label: 'CryptoKitty',
        itemImageUrl: placeholderImage,
        subtext: 'Collectible from Smart Wallet',
        actionLabel: 'Received',
        iconBackgroundColor: 'basic060',
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
      event={{ type: TRANSACTION_EVENT, tag: PAYMENT_NETWORK_ACCOUNT_TOPUP, hash: '0xHash' }}
      itemData={{
        label: 'Pillar Network',
        itemImageSource: PPNIcon,
        fullItemValue: '+ 10 PLR',
        subtext: 'from Smart Wallet',
        valueColor: 'secondaryAccent140',
      }}
    />
  ))
  .add('Pillar Network Top Up (SW -> PPN)', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{ type: TRANSACTION_EVENT, tag: PAYMENT_NETWORK_ACCOUNT_TOPUP, hash: '0xHash' }}
      itemData={{
        label: 'Smart Wallet',
        itemImageSource: smartWalletIcon,
        fullItemValue: '- 10 PLR',
        subtext: 'to Pillar Network',
        valueColor: 'basic010',
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
        hash: '0xHash',
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
        hash: '0xHash',
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
        hash: '0xHash',
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
        hash: '0xHash',
      }}
      itemData={{
        label: 'Pillar Network',
        itemImageSource: PPNIcon,
        fullItemValue: '- 10 PLR',
        subtext: 'to Smart Wallet',
        valueColor: 'basic010',
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
        hash: '0xHash',
      }}
      itemData={{
        label: 'Smart Wallet',
        itemImageSource: smartWalletIcon,
        fullItemValue: '+ 10 PLR',
        subtext: 'from Pillar Network',
        valueColor: 'secondaryAccent140',
      }}
    />
  ))
  .add('PoolTogether Deposit DAI', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        tag: POOLTOGETHER_DEPOSIT_TRANSACTION,
        hash: '0xHash',
        extra: { symbol: 'DAI', decimals: 18, amount: '1000000000000000000' },
      }}
      itemData={{
        label: 'Pool Together',
        itemImageSource: poolTogetherLogo,
        cornerIcon: daiIcon,
        itemValue: '- 1 DAI',
        itemImageRoundedSquare: true,
      }}
    />
  ))
  .add('PoolTogether Deposit USDC', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        tag: POOLTOGETHER_DEPOSIT_TRANSACTION,
        hash: '0xHash',
        extra: { symbol: 'USDC', decimals: 18, amount: '2000000000000000000' },
      }}
      itemData={{
        label: 'Pool Together',
        itemImageSource: poolTogetherLogo,
        cornerIcon: usdcIcon,
        itemValue: '-1 USDC',
        itemImageRoundedSquare: true,
      }}
    />
  ))
  .add('PoolTogether Withdraw DAI', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        tag: POOLTOGETHER_WITHDRAW_TRANSACTION,
        hash: '0xHash',
        extra: { symbol: 'DAI', decimals: 18, amount: '1000000000000000000' },
      }}
      itemData={{
        label: 'Pool Together',
        itemImageSource: poolTogetherLogo,
        cornerIcon: daiIcon,
        itemValue: '+1 DAI',
        itemImageRoundedSquare: true,
      }}
    />
  ))
  .add('PoolTogether Withdraw USDC', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        tag: POOLTOGETHER_WITHDRAW_TRANSACTION,
        hash: '0xHash',
        extra: { symbol: 'USDC', decimals: 18, amount: '2000000000000000000' },
      }}
      itemData={{
        label: 'Pool Together',
        itemImageSource: poolTogetherLogo,
        cornerIcon: usdcIcon,
        itemValue: '- 1 USDC',
        itemImageRoundedSquare: true,
      }}
    />
  ))
  .add('Liquidity added', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        tag: LIQUIDITY_POOLS_ADD_LIQUIDITY_TRANSACTION,
        hash: '0xHash',
        extra: {
          amount: 12.3,
          pool: LIQUIDITY_POOLS()[0],
          tokenAmounts: [1, 2],
         },
      }}
      itemData={{
        label: 'Liquidity added',
        subtext: 'Wallet → Uniswap v2 ETH/PLR',
      }}
    />
  ))
  .add('Liquidity removed', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        tag: LIQUIDITY_POOLS_REMOVE_LIQUIDITY_TRANSACTION,
        hash: '0xHash',
        extra: {
          amount: 12.3,
          pool: LIQUIDITY_POOLS()[0],
          tokenAmounts: [1, 2],
         },
      }}
      itemData={{
        label: 'Liquidity removed',
        subtext: 'Uniswap v2 ETH/PLR → Wallet',
      }}
    />
  ))
  .add('Liquidity staked', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        tag: LIQUIDITY_POOLS_STAKE_TRANSACTION,
        hash: '0xHash',
        extra: {
          amount: 12.3,
          pool: LIQUIDITY_POOLS()[0],
         },
      }}
      itemData={{
        label: 'Staked',
        subtext: 'Uniswap v2 ETH/PLR',
        itemValue: '- 70 UNI-V2',
        fullItemValue: '- 70 UNI-V2',
      }}
    />
  ))
  .add('Liquidity unstaked', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        tag: LIQUIDITY_POOLS_UNSTAKE_TRANSACTION,
        hash: '0xHash',
        extra: {
          amount: 12.3,
          pool: LIQUIDITY_POOLS()[0],
         },
      }}
      itemData={{
        label: 'Unstaked',
        subtext: 'Uniswap v2 ETH/PLR',
        itemValue: '+ 70 UNI-V2',
        fullItemValue: '+ 70 UNI-V2',
        valueColor: 'secondaryAccent140',
      }}
    />
  ))
  .add('Liquidity reward claimed', () => (
    <EventDetailsStoryItem
      {...reduxData}
      {...actions}
      {...commonProps}
      event={{
        type: TRANSACTION_EVENT,
        tag: LIQUIDITY_POOLS_REWARDS_CLAIM_TRANSACTION,
        hash: '0xHash',
        extra: {
          amount: 1000,
          pool: LIQUIDITY_POOLS()[0],
         },
      }}
      itemData={{
        label: 'Rewards claimed',
        subtext: 'Uniswap v2 ETH/PLR',
        itemValue: '+ 1,000 PLR',
        fullItemValue: '+ 1,000 PLR',
        valueColor: 'secondaryAccent140',
      }}
    />
  ));

