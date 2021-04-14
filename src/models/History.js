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
  id: string,
  date: Date,
|};
export type HistoryItem =
  | HistoryItemTokenReceived
  | HistoryItemTokenSent
  | HistoryItemCollectibleReceived
  | HistoryItemCollectibleSent
  | HistoryItemWalletEvent
  | HistoryItemEnsName
  | HistoryItemBadgeEvent
  | HistoryItemUnknown;

export type HistoryItemTokenReceived = {|
  ...HistoryItemCommon,
  type: 'tokenReceived',
  fromAddress: string,
  toAddress: string,
  symbol: string,
  value: ?BigNumber,
|};

export type HistoryItemTokenSent = {|
  ...HistoryItemCommon,
  type: 'tokenSent',
  fromAddress: string,
  toAddress: string,
  symbol: string,
  value: ?BigNumber,
|};

export type HistoryItemCollectibleReceived = {|
  ...HistoryItemCommon,
  type: 'collectibleReceived',
  fromAddress: string,
  toAddress: string,
  asset: string,
|};

export type HistoryItemCollectibleSent = {|
  ...HistoryItemCommon,
  type: 'collectibleSent',
  fromAddress: string,
  toAddress: string,
  asset: string,
|};

export type HistoryItemWalletEvent = {|
  ...HistoryItemCommon,
  type: 'walletEvent',
  title?: string,
  subtitle?: string,
  event: string,
|};

export type HistoryItemEnsName = {|
  ...HistoryItemCommon,
  type: 'ensName',
  ensName: string,
|};

export type HistoryItemBadgeEvent = {|
  ...HistoryItemCommon,
  type: 'badgeEvent',
  title?: string,
  subtitle?: string,
  event: string,
  iconUrl: ?string,
|};

export type HistoryItemUnknown = {|
  ...HistoryItemCommon,
  type: 'unknown',
|};
