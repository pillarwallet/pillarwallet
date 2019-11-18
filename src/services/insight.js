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
import { BITCOIN_INSIGHT_URL } from 'react-native-dotenv';

const receiveResponse = (name: string) => {
  return (response) => {
    if (!response.ok) {
      const message = `${name} failed`;
      console.error(message, { response }); // eslint-disable-line no-console
      return new Error(message);
    }

    return response;
  };
};

export const sendRawTransactionToNode = async (rawtx: string) => {
  return fetch(`${BITCOIN_INSIGHT_URL}/tx/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ rawtx }),
  })
    .then(receiveResponse('sendRawTransactionToNode'));
};

export const getAddressUtxosFromNode = (address: string) => {
  return fetch(`${BITCOIN_INSIGHT_URL}/addr/${address}/utxo`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })
    .then(receiveResponse('getAddressUtxosFromNode'));
};
