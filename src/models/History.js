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

// types
import type { FiatValue, TokenValue } from 'models/Value';
import type { Transaction } from 'models/Transaction';
import type { ChainRecord } from 'models/Chain';

/**
 * Enum of all supported event types.
 */
export const EVENT_TYPE = {
  TOKEN_RECEIVED: ('tokenReceived': 'tokenReceived'),
  TOKEN_SENT: ('tokenSent': 'tokenSent'),
  COLLECTIBLE_RECEIVED: ('collectibleReceived': 'collectibleReceived'),
  COLLECTIBLE_SENT: ('collectibleSent': 'collectibleSent'),
  TOKEN_EXCHANGE: ('tokenExchange': 'tokenExchange'),
  EXCHANGE_FROM_FIAT: ('exchangeFromFiat': 'exchangeFromFiat'),
  WALLET_CREATED: ('walletCreated': 'walletCreated'),
  WALLET_BACKED_UP: ('walletBackedUp': 'walletBackedUp'),
  WALLET_ACTIVATED: ('walletActivated': 'walletActivated'),
  ENS_NAME_REGISTERED: ('ensNameRegistered': 'ensNameRegistered'),
  PPN_INITIALIZED: ('ppnInitialized': 'ppnInitialized'),
};

export type EventType = $Values<typeof EVENT_TYPE>;

/**
 * Transaction status for events that relate to transactions.
 */
export const TRANSACTION_STATUS = {
  CONFIRMED: ('confirmed': 'confirmed'),
  FAILED: ('failed': 'failed'),
  PENDING: ('pending': 'pending'),
  TIMEDOUT: ('timedout': 'timedout'),
};

export type TransactionStatus = $Values<typeof TRANSACTION_STATUS>;

/**
 * Union type describing all supported event types.
 */
export type Event =
  | TokenTransactionEvent
  | CollectibleTransactionEvent
  | TokenExchangeEvent
  | ExchangeFromFiatEvent
  | WalletEvent
  | EnsNameRegisteredEvent;

/**
 * Common fields in all events.
 */
type EventCommon = {|
  date: Date,
  id: string,
|};

export type TokenTransactionEvent = TokenReceivedEvent | TokenSentEvent;

export type TokenReceivedEvent = {|
  ...EventCommon,
  type: typeof EVENT_TYPE.TOKEN_RECEIVED,
  hash: string,
  fromAddress: string,
  toAddress: string,
  value: TokenValue,
  status: TransactionStatus,
|};

export type TokenSentEvent = {|
  ...EventCommon,
  type: typeof EVENT_TYPE.TOKEN_SENT,
  hash: string,
  batchHash?: string,
  fromAddress: string,
  toAddress: string,
  value: TokenValue,
  fee: TokenValue,
  status: TransactionStatus,
|};


export type CollectibleTransactionEvent = CollectibleReceivedEvent | CollectibleSentEvent;

export type CollectibleReceivedEvent = {|
  ...EventCommon,
  type: typeof EVENT_TYPE.COLLECTIBLE_RECEIVED,
  hash: string,
  fromAddress: string,
  toAddress: string,
  title: string,
  imageUrl: string,
  status: TransactionStatus,
|};

export type CollectibleSentEvent = {|
  ...EventCommon,
  type: typeof EVENT_TYPE.COLLECTIBLE_SENT,
  hash: string,
  batchHash?: string,
  fromAddress: string,
  toAddress: string,
  title: string,
  imageUrl: string,
  fee: TokenValue,
  status: TransactionStatus,
|};

export type TokenExchangeEvent = {|
  ...EventCommon,
  type: typeof EVENT_TYPE.TOKEN_EXCHANGE,
  hash: string,
  batchHash?: string,
  fromAddress: string,
  toAddress: string,
  fromValue: TokenValue,
  toValue: TokenValue,
  fee: TokenValue,
  status: TransactionStatus,
|};

export type ExchangeFromFiatEvent = {|
  ...EventCommon,
  type: typeof EVENT_TYPE.EXCHANGE_FROM_FIAT,
  hash: string,
  batchHash?: string,
  fromAddress: string,
  toAddress: string,
  fromValue: FiatValue,
  toValue: TokenValue,
  fee: TokenValue,
  status: TransactionStatus,
|};

export type WalletEvent = WalletCreated | WalletActivated | WalletBackedUp;

export type WalletCreated = {|
  ...EventCommon,
  type: typeof EVENT_TYPE.WALLET_CREATED,
|};

export type WalletActivated = {|
  ...EventCommon,
  type: typeof EVENT_TYPE.WALLET_ACTIVATED,
  hash: string,
  fee: TokenValue,
  status: TransactionStatus,
|};

export type WalletBackedUp = {|
  ...EventCommon,
  type: typeof EVENT_TYPE.WALLET_BACKED_UP,
|};

export type EnsNameRegisteredEvent = {|
  ...EventCommon,
  type: typeof EVENT_TYPE.ENS_NAME_REGISTERED,
  ensName: string,
  hash: ?string,
  fee: ?TokenValue,
|};

export type TransactionsStore = {
  [accountId: string]: ChainRecord<Transaction[]>,
};

export type HistoryLastSyncIds = {
  [accountId: string]: string,
};

export type AccountWalletEvents = { [accountId: string]: ChainRecord<WalletEvent[]> };
