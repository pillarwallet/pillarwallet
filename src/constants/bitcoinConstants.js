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
export const SET_BITCOIN_ADDRESSES = 'SET_BITCOIN_ADDRESSES';
export const CREATED_BITCOIN_ADDRESS = 'CREATED_BITCOIN_ADDRESS';
export const BITCOIN_WALLET_CREATION_FAILED = 'BITCOIN_WALLET_CREATION_FAILED';
export const DEFAULT_BTC_NETWORK = process.env.BITCOIN_NETWORK || 'testnet';
export const UPDATE_BITCOIN_BALANCE = 'UPDATE_BITCOIN_BALANCE';
export const REFRESH_THRESHOLD = (1000 * 60) * 10; // Cache utxos for ten minutes
export const MIN_CONFIRMATIONS = 1; // Use utxos with at least 1 confirmation
