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

import type { TokenOperation } from 'models/EthplorerSdkTypes';

export type WBTCFeesWithRate = {
  exchangeRate: number,
  renVMFee: number,
  networkFee: number,
  estimate: number
};

export type WBTCFeesRaw = {
  btc: {
    ethereum: {
      burn: number,
      mint: number,
    },
    lock: number,
    release: number,
  }
};

export type WBTCGatewayAddressParams = {
  amount: number, // The amount of BTC (including fees)
  maxSlippage: number, // e.g. 0.05
  address?: string, // The destination address. Default is the requester wallet address
};

type WBTCResponseResult = "success" | "error";

export type WBTCGatewayAddressResponse = {
  result: WBTCResponseResult,
  message?: string,
  gatewayAddress?: string,
  exchangeRate?: number,
  amount?: number,
  nonce?: string,
} | typeof undefined;

export type PendingWBTCTransaction = {
  amount: number,
  dateCreated: number,
};

export type FetchedWBTCTx = TokenOperation;
