// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
import { BigNumber } from 'bignumber.js';

// Components
import HistoryList from 'components/HistoryList';

// Types
import type { HistoryItem } from 'models/History';

function HistoryListEtherspot() {
  const items = useHistoryItems();

  return <HistoryList items={items} />;
}

export default HistoryListEtherspot;

// Return mock data for available cell types
function useHistoryItems(): HistoryItem[] {
  return [
    {
      type: 'tokenReceived',
      id: '0xb0da60fa0c07d8b8f5636f8bf02216dd4235d6d8f9e76c058c07d6a9f494670c',
      date: new Date('2021-04-14'),
      fromAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
      toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
      value: BigNumber(4.2),
      symbol: 'ETH',
    },
    {
      type: 'tokenSent',
      id: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
      date: new Date('2021-04-14'),
      fromAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
      toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
      value: BigNumber(100),
      symbol: 'PLR',
    },
    {
      type: 'badgeEvent',
      id: '5ca21c49754407000644f73b',
      date: new Date('2021-04-13'),
      title: 'Coin Collector',
      subtitle: 'Badge',
      event: 'Received',
      iconUrl:
        'https://s3.eu-west-2.amazonaws.com/pillar-prod-badges-images-eu-west-2-304069782345/transaction-in_180%403x.png',
    },
    {
      type: 'walletEvent',
      id: '5ca21c49754407000644f73b',
      date: new Date('2021-04-11'),
      title: 'Pillar Pay',
      event: 'Activate',
    },
    {
      type: 'ensName',
      id: 'ensName-1',
      date: new Date('2021-04-10'),
      ensName: 'maciej.pillar.eth',
    },
    {
      type: 'walletEvent',
      id: '5ca21c49754407000644f73b',
      date: new Date('2021-04-10'),
      title: 'Wallet',
      event: 'Created',
    },
  ];
}
