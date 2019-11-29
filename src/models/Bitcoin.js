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

export type BitcoinStore = {
  keys?: { [key: string]: string },
};

export type BitcoinTransactionTarget = {
  address: string,
  value: number,
  isChange?: boolean,
};

export type BitcoinUtxo = {
  address: string,
  txid: string,
  mintTxid?: string,
  vout: number,
  scriptPubKey: string,
  amount: number,
  satoshis: number,
  height: number,
  confirmations: number,
  value?: number,
};

export type BitcoinTransactionPlan = {
  inputs: BitcoinUtxo[],
  outputs: BitcoinTransactionTarget[],
  fee?: number,
  isValid?: boolean,
};

export type BitcoinAddress = {
  address: string,
  updatedAt: number,
};

export type BTCBalance = {
  confirmed: number,
  unconfirmed: number,
  balance: number,
};


export type BitcoinBalance = {
  [address: string]: BTCBalance,
};

export type BTCTransaction = {
  _id: string,
  chain: string,
  network: string,
  coinbase: boolean,
  mintIndex: number,
  spentTxid: string,
  mintTxid: string,
  mintHeight: number,
  spentHeight: number,
  address: string,
  script: string,
  value: number,
  confirmations: number,
  details: Object,
};
