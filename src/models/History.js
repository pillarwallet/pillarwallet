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

import { BigNumber } from 'bignumber.js';

type HistoryItemCommon = {|
  date: Date,
  id: string,
|};

export type TransactionStatus = 'confirmed' | 'failed' | 'pending' | 'timedout';

export const TRANSACTION_STATUS = {
  CONFIRMED: ('confirmed': 'confirmed'),
  FAILED: ('failed': 'failed'),
  PENDING: ('pending': 'pending'),
  TIMEDOUT: ('timedout': 'timedout'),
};

export type HistoryItem =
  | TokenReceivedHistoryItem
  | TokenSentHistoryItem
  | CollectibleReceivedHistoryItem
  | CollectibleSentHistoryItem
  | WalletEventHistoryItem
  | EnsNameHistoryItem
  | BadgeReceivedHistoryItem

export type TokenReceivedHistoryItem = {|
  ...HistoryItemCommon,
  type: 'tokenReceived',
  fromAddress: string,
  toAddress: string,
  symbol: string,
  value: ?BigNumber,
  status: TransactionStatus,
|};

export type TokenSentHistoryItem = {|
  ...HistoryItemCommon,
  type: 'tokenSent',
  fromAddress: string,
  toAddress: string,
  symbol: string,
  value: ?BigNumber,
  status: TransactionStatus,
|};

export type CollectibleReceivedHistoryItem = {|
  ...HistoryItemCommon,
  type: 'collectibleReceived',
  fromAddress: string,
  toAddress: string,
  title: string,
  imageUrl: string,
  status: TransactionStatus,
|};

export type CollectibleSentHistoryItem = {|
  ...HistoryItemCommon,
  type: 'collectibleSent',
  fromAddress: string,
  toAddress: string,
  title: string,
  imageUrl: string,
  status: TransactionStatus,
|};

export type WalletEventHistoryItem = {|
  ...HistoryItemCommon,
  type: 'walletEvent',
  title?: string,
  subtitle?: string,
  event: string,
|};

export type EnsNameHistoryItem = {|
  ...HistoryItemCommon,
  type: 'ensName',
  ensName: string,
|};

export type BadgeReceivedHistoryItem = {|
  ...HistoryItemCommon,
  type: 'badgeReceived',
  title?: string,
  iconUrl: ?string,
|};
