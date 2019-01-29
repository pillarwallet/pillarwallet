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
import {
  TRANSACTION_CONFIRMATION_EVENT,
  TRANSACTION_PENDING_EVENT,
  TX_PENDING_STATUS,
} from 'constants/historyConstants';
import { utils } from 'ethers';
import type { Transaction, TransactionEthers } from 'models/Transaction';

export const buildHistoryTransaction = ({
  from,
  hash,
  to,
  value,
  gasPrice,
  gasLimit,
  asset,
  note,
}: TransactionEthers): Transaction => ({
  status: TX_PENDING_STATUS,
  gasUsed: parseFloat(utils.formatEther(gasPrice.mul(gasLimit))),
  gasPrice: Number(gasPrice),
  value: typeof value === 'object' ? value.toString() : value,
  from,
  hash,
  to,
  _id: hash,
  asset,
  createdAt: +new Date() / 1000, // seconds
  nbConfirmations: 0,
  transaction: {},
  __v: 0,
  receipt: {},
  note,
});

export const isTransactionEvent = (eventType: string) => {
  return [
    TRANSACTION_PENDING_EVENT,
    TRANSACTION_CONFIRMATION_EVENT,
  ].includes(eventType);
};
