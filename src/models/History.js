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

import type { TokenValue, FiatValue } from 'models/Value';

export type TransactionStatus = 'confirmed' | 'failed' | 'pending' | 'timedout';

export const TRANSACTION_STATUS = {
  CONFIRMED: ('confirmed': 'confirmed'),
  FAILED: ('failed': 'failed'),
  PENDING: ('pending': 'pending'),
  TIMEDOUT: ('timedout': 'timedout'),
};

export type Event =
  | TokenTransactionEvent
  | CollectibleTransactionEvent
  | TokenExchangeEvent
  | ExchangeFromFiatEvent
  | WalletEvent
  | EnsNameEvent
  | BadgeReceivedEvent;

type EventCommon = {|
  date: Date,
  id: string,
|};

export type TokenTransactionEvent = TokenReceivedEvent | TokenSentEvent;

export type TokenReceivedEvent = {|
  ...EventCommon,
  type: 'tokenReceived',
  hash: string,
  fromAddress: string,
  toAddress: string,
  value: TokenValue,
  status: TransactionStatus,
|};

export type TokenSentEvent = {|
  ...EventCommon,
  type: 'tokenSent',
  hash: string,
  fromAddress: string,
  toAddress: string,
  value: TokenValue,
  fee: TokenValue,
  status: TransactionStatus,
|};


export type CollectibleTransactionEvent = CollectibleReceivedEvent | CollectibleSentEvent;

export type CollectibleReceivedEvent = {|
  ...EventCommon,
  type: 'collectibleReceived',
  hash: string,
  fromAddress: string,
  toAddress: string,
  title: string,
  imageUrl: string,
  status: TransactionStatus,
|};

export type CollectibleSentEvent = {|
  ...EventCommon,
  type: 'collectibleSent',
  hash: string,
  fromAddress: string,
  toAddress: string,
  title: string,
  imageUrl: string,
  fee: TokenValue,
  status: TransactionStatus,
|};

export type TokenExchangeEvent = {|
  ...EventCommon,
  type: 'tokenExchange',
  hash: string,
  fromAddress: string,
  toAddress: string,
  fromValue: TokenValue,
  toValue: TokenValue,
  fee: TokenValue,
  status: TransactionStatus,
|};

export type ExchangeFromFiatEvent = {|
  ...EventCommon,
  type: 'exchangeFromFiat',
  fromAddress: string,
  toAddress: string,
  fromValue: FiatValue,
  toValue: TokenValue,
  status: TransactionStatus,
|};

export type WalletEvent = WalletCreated | WalletActivated;

export type WalletCreated = {|
  ...EventCommon,
  type: 'walletCreated',
|};

export type WalletActivated = {|
  ...EventCommon,
  type: 'walletActivated',
  hash: string,
  fee: TokenValue,
  status: TransactionStatus,
|};

export type EnsNameEvent = {|
  ...EventCommon,
  type: 'ensName',
  ensName: string,
  hash: string,
  fee: TokenValue,
|};

export type BadgeReceivedEvent = {|
  ...EventCommon,
  type: 'badgeReceived',
  badgeId: string,
  title?: string,
  iconUrl: ?string,
|};
