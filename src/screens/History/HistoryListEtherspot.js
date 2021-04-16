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
/* eslint-disable i18next/no-literal-string */

import * as React from 'react';
import { BigNumber } from 'bignumber.js';

// Components
import HistoryList from 'components/HistoryList';

// Types
import { type HistoryItem, TRANSACTION_STATUS } from 'models/History';

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
      status: TRANSACTION_STATUS.CONFIRMED,
    },
    {
      type: 'tokenSent',
      id: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
      date: new Date('2021-04-14'),
      fromAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
      toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
      value: BigNumber(100),
      symbol: 'PLR',
      status: TRANSACTION_STATUS.FAILED,
    },
    {
      type: 'collectibleReceived',
      date: new Date('2021-04-12'),
      id: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15123',
      fromAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
      toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
      title: 'Old Asynchronous Helmet',
      imageUrl:
        'https://lh3.googleusercontent.com/upSSwyYkXf4eMI-0QQhkx1oxgLiacjH425t7sDxDX3JFwfxMhgcwMG70oM5ZhsS4WX2LJwlsBBStSBPJcFNIONWq',
      status: TRANSACTION_STATUS.PENDING,
    },
    {
      type: 'collectibleSent',
      id: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15456',
      date: new Date('2021-04-12'),
      fromAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
      toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
      title: 'Old Asynchronous Helmet',
      imageUrl:
        'https://lh3.googleusercontent.com/upSSwyYkXf4eMI-0QQhkx1oxgLiacjH425t7sDxDX3JFwfxMhgcwMG70oM5ZhsS4WX2LJwlsBBStSBPJcFNIONWq',
      status: TRANSACTION_STATUS.TIMEDOUT,
    },
    {
      type: 'badgeReceived',
      id: '5ca21c49754407000644f73b',
      date: new Date('2021-04-13'),
      title: 'Coin Collector',
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
    {
      type: 'paymentChannelReceived',
      date: new Date('2021-03-30'),
      id: '21234',
      fromAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
      toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
      value: { symbol: 'PLR', value: BigNumber(10231) },
      status: TRANSACTION_STATUS.CONFIRMED,
    },
    {
      type: 'paymentChannelSent',
      date: new Date('2021-03-30'),
      id: '21235',
      fromAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
      toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
      value: { symbol: 'PLR', value: BigNumber(1235.0231) },
      status: TRANSACTION_STATUS.CONFIRMED,
    },
    {
      type: 'paymentChannelTopUp',
      date: new Date('2021-03-30'),
      id: '21236',
      fromAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
      toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
      value: { symbol: 'PLR', value: BigNumber(100) },
      status: TRANSACTION_STATUS.CONFIRMED,
    },
    {
      type: 'paymentChannelWithdrawal',
      date: new Date('2021-03-30'),
      id: '212341',
      fromAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
      toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
      value: { symbol: 'PLR', value: BigNumber(100) },
      status: TRANSACTION_STATUS.CONFIRMED,
    },
    {
      type: 'paymentChannelSettlement',
      date: new Date('2021-03-30'),
      id: '212343',
      fromAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
      toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
      inputValues: [{ symbol: 'PLR', value: BigNumber(100) }],
      outputValue: { symbol: 'PLR', value: BigNumber(100) },
      status: TRANSACTION_STATUS.CONFIRMED,
    },
    {
      type: 'paymentChannelSettlement',
      date: new Date('2021-03-30'),
      id: '212344',
      fromAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
      toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
      inputValues: [
        { symbol: 'PLR', value: BigNumber(100) },
        { symbol: 'ETH', value: BigNumber(100) },
      ],
      outputValue: { symbol: 'PLR', value: BigNumber(100) },
      status: TRANSACTION_STATUS.CONFIRMED,
    },
  ];
}
