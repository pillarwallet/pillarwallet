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

export type Transaction = {
  _id: string,
  transaction: Object,
  hash: string,
  to: string,
  from: string,
  createdAt: number,
  asset: string,
  nbConfirmations: number,
  gasUsed: number,
  gasPrice: number,
  status: string,
  value: string,
  __v: number,
  receipt: Object,
  note?: ?string
}

export type TransactionPayload = {
  gasLimit: number,
  amount: number,
  to: string,
  gasPrice: number,
  txFeeInWei: number,
  symbol: string,
  contractAddress: ?string,
  decimals: number,
  note?: ?string
}

export type TransactionEthers = {
  from: string,
  hash: string,
  to: string,
  value: Object,
  gasPrice: Object,
  gasLimit: Object,
  asset: string,
  note?: ?string
}
