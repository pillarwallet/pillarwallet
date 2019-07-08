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
import { MIN_CONFIRMATIONS } from 'constants/bitcoinConstants';
import type { BitcoinUtxo } from 'models/Bitcoin';

export const satoshisToBtc = (satoshis: number): number => {
  return satoshis * 0.00000001;
};

export const btcToSatoshis = (btc: number): number => {
  return btc * 100000000;
};

export const formatBtc = (amount: number): string => {
  // TODO: format
  return amount.toString();
};

// returns satoshis
export const unspentAmount = (unspent: BitcoinUtxo[]): number => {
  const satoshis = unspent.reduce((acc: number, transaction: BitcoinUtxo): number => {
    if (transaction.confirmations < MIN_CONFIRMATIONS) {
      return acc;
    }
    return acc + transaction.satoshis;
  }, 0);

  return satoshisToBtc(satoshis);
};
