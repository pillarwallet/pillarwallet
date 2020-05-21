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
import { ActivityFeedItem as ActivityFeedItemNoTheme } from 'components/ActivityFeed/ActivityFeedItem';

import {
  TYPE_RECEIVED,
  TYPE_ACCEPTED,
  TYPE_SENT,
} from 'constants/invitationsConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import {
  TRANSACTION_EVENT,
  TX_PENDING_STATUS,
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
import { withTheme } from 'styled-components/native';


const placeholderImage = 'https://picsum.photos/200';

const reduxData = {
  contacts: [{
    username: 'john', ethAddress: '0x111111', profileImage: placeholderImage, connectionKey: '', id: '',
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
  activeAccountAddress: '0x000000',
  selectEvent: () => {},
  acceptInvitation: () => {},
  rejectInvitation: () => {},
  activeBlockchainNetwork: '',
  isSmartWalletActivated: false,
  accounts: [],
  bitcoinAddresses: [],
  referralRewardIssuersAddresses: ['0x123456'],
};

const ActivityFeedItem = withTheme(ActivityFeedItemNoTheme);

storiesOf('ActivityFeedItem', module)
  .add('Key wallet created', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{ type: USER_EVENT, subType: WALLET_CREATE_EVENT, eventTitle: 'Wallet created' }}
    />
  ))
  .add('Smart wallet created', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{ type: USER_EVENT, subType: WALLET_CREATE_EVENT, eventTitle: 'Smart wallet created' }}
    />
  ))
  .add('Key wallet imported', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{ type: USER_EVENT, subType: WALLET_CREATE_EVENT, eventTitle: 'Wallet imported' }}
    />
  ))
  .add('PPN created', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{ type: USER_EVENT, subType: PPN_INIT_EVENT }}
    />
  ))
  .add('Collectible received', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: COLLECTIBLE_TRANSACTION,
        from: '0x000000',
        to: '',
        icon: placeholderImage,
        asset: 'CryptoKitty',
        assetData: { image: placeholderImage },
      }}
    />
  ))
  .add('Collectible sent', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: COLLECTIBLE_TRANSACTION,
        to: '0x000000',
        from: '',
        icon: placeholderImage,
        asset: 'CryptoKitty',
        assetData: { image: placeholderImage },
      }}
    />
  ))
  .add('Badge reward', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: BADGE_REWARD_EVENT, name: 'Super kitty badge!', imageUrl: placeholderImage,
      }}
    />
  ))
  .add('Key wallet incoming', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TRANSACTION_EVENT,
        from: '0x000000',
        to: '0x222222',
        accountType: ACCOUNT_TYPES.KEY_BASED,
        asset: 'ETH',
        value: '1000000000000000000',
      }}
    />
  ))
  .add('Key wallet incoming pending', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TRANSACTION_EVENT,
        from: '0x000000',
        to: '0x222222',
        accountType: ACCOUNT_TYPES.KEY_BASED,
        asset: 'ETH',
        value: '1000000000000000000',
        status: TX_PENDING_STATUS,
      }}
    />
  ))
  .add('Key wallet outgoing', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TRANSACTION_EVENT,
        to: '0x000000',
        from: '0x222222',
        accountType: ACCOUNT_TYPES.KEY_BASED,
        asset: 'ETH',
        value: '1000000000000000000',
      }}
    />
  ))
  .add('Key wallet outgoing pending', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TRANSACTION_EVENT,
        to: '0x000000',
        from: '0x222222',
        accountType: ACCOUNT_TYPES.KEY_BASED,
        asset: 'ETH',
        value: '1000000000000000000',
        status: TX_PENDING_STATUS,
      }}
    />
  ))
  .add('Key wallet incoming contact', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TRANSACTION_EVENT,
        from: '0x111111',
        to: '0x000000',
        accountType: ACCOUNT_TYPES.KEY_BASED,
        asset: 'ETH',
        value: '1000000000000000000',
      }}
    />
  ))
  .add('Key wallet outgoing contact', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TRANSACTION_EVENT,
        to: '0x111111',
        from: '0x000000',
        accountType: ACCOUNT_TYPES.KEY_BASED,
        asset: 'ETH',
        value: '1000000000000000000',
      }}
    />
  ))
  .add('Smart wallet incoming', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TRANSACTION_EVENT,
        from: '0x000000',
        to: '0x222222',
        accountType: ACCOUNT_TYPES.SMART_WALLET,
        asset: 'ETH',
        value: '1000000000000000000',
      }}
    />
  ))
  .add('Smart wallet incoming pending', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TRANSACTION_EVENT,
        from: '0x000000',
        to: '0x222222',
        accountType: ACCOUNT_TYPES.SMART_WALLET,
        asset: 'ETH',
        value: '1000000000000000000',
        status: TX_PENDING_STATUS,
      }}
    />
  ))
  .add('Smart wallet outgoing', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TRANSACTION_EVENT,
        to: '0x000000',
        from: '0x222222',
        accountType: ACCOUNT_TYPES.SMART_WALLET,
        asset: 'ETH',
        value: '1000000000000000000',
      }}
    />
  ))
  .add('Smart wallet outgoing pending', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TRANSACTION_EVENT,
        to: '0x000000',
        from: '0x222222',
        accountType: ACCOUNT_TYPES.SMART_WALLET,
        asset: 'ETH',
        value: '1000000000000000000',
        status: TX_PENDING_STATUS,
      }}
    />
  ))
  .add('Smart wallet incoming contact', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TRANSACTION_EVENT,
        from: '0x111111',
        to: '0x000000',
        accountType: ACCOUNT_TYPES.SMART_WALLET,
        asset: 'ETH',
        value: '1000000000000000000',
      }}
    />
  ))
  .add('Smart wallet outgoing contact', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TRANSACTION_EVENT,
        to: '0x111111',
        from: '0x000000',
        accountType: ACCOUNT_TYPES.SMART_WALLET,
        asset: 'ETH',
        value: '1000000000000000000',
      }}
    />
  ))
  .add('Synthetic sent', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TRANSACTION_EVENT,
        to: '0x111111',
        from: '0x000000',
        asset: 'PLR',
        value: '1000000000000000000',
        isPPNTransaction: true,
      }}
    />
  ))
  .add('Synthetic received', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TRANSACTION_EVENT,
        from: '0x111111',
        to: '0x000000',
        asset: 'PLR',
        value: '1000000000000000000',
        isPPNTransaction: true,
      }}
    />
  ))
  .add('Bitcoin received', () => (
    <ActivityFeedItem
      {...reduxData}
      activeBlockchainNetwork="BITCOIN"
      event={{
        type: TRANSACTION_EVENT,
        from: '0x111111',
        to: '0x000000',
        asset: 'BTC',
        value: '1000000000000000000',
      }}
    />
  ))
  .add('Bitcoin sent', () => (
    <ActivityFeedItem
      {...reduxData}
      activeBlockchainNetwork="BITCOIN"
      event={{
        type: TRANSACTION_EVENT,
        to: '0x111111',
        from: '0x000000',
        asset: 'BTC',
        value: '1000000000000000000',
      }}
    />
  ))
  .add('Connection request', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TYPE_RECEIVED,
        username: 'john',
        profileImage: placeholderImage,
      }}
    />
  ))
  .add('Connection established', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TYPE_ACCEPTED,
        username: 'john',
        profileImage: placeholderImage,
      }}
    />
  ))
  .add('Connection outgoing request', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TYPE_SENT,
        username: 'john',
        profileImage: placeholderImage,
      }}
    />
  ))
  .add('Settlement', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TRANSACTION_EVENT,
        tag: PAYMENT_NETWORK_TX_SETTLEMENT,
        from: '0x111111',
        to: '0x000000',
        extra: [{
          symbol: 'PLR',
          value: '1000000000000000000',
        }, {
          symbol: 'PLR',
          value: '2000000000000000000',
        }],
      }}
    />
  ))
  .add('PPN top up', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TRANSACTION_EVENT,
        tag: PAYMENT_NETWORK_ACCOUNT_TOPUP,
        asset: 'PLR',
        value: '1000000000000000000',
      }}
    />
  ))
  .add('PPN withdrawal', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TRANSACTION_EVENT,
        tag: PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
        asset: 'PLR',
        value: '1000000000000000000',
      }}
    />
  ))
  .add('ENS registration', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
      type: TRANSACTION_EVENT,
      tag: SET_SMART_WALLET_ACCOUNT_ENS,
    }}
    />
  ))
  .add('SW activated', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TRANSACTION_EVENT,
        tag: PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT,
        asset: 'ETH',
        value: '1000000000000000000',
        from: '0x000000',
      }}
    />
  ))
  .add('Wallet backup', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: USER_EVENT,
        subType: WALLET_BACKUP_EVENT,
      }}
    />
  ))
  .add('Key wallet referral reward', () => (
    <ActivityFeedItem
      {...reduxData}
      event={{
        type: TRANSACTION_EVENT,
        from: '0x123456',
        to: '0x000000',
        accountType: ACCOUNT_TYPES.KEY_BASED,
        asset: 'PLR',
        value: '250000000000000000000',
      }}
    />
  ));

