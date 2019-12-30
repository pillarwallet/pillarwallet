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
import { BITCOIN_INSIGHT_URL, BITCOIN_NETWORK } from 'react-native-dotenv';

const BTC_NET = BITCOIN_NETWORK === 'testnet' ? BITCOIN_NETWORK : 'mainnet';

const validateResponse = (name: string) => {
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
  return fetch(`${BITCOIN_INSIGHT_URL}/tx/send?chain=BTC&network=${BTC_NET}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ rawTx: rawtx }),
  })
    .then(validateResponse('sendRawTransactionToNode'));
};

export const getAddressUtxosFromNode = (address: string) => {
  return fetch(`${BITCOIN_INSIGHT_URL}/address/${address}/?unspent=true`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })
    .then(validateResponse('getAddressUtxosFromNode'));
};

export const getAddressBalanceFromNode = (address: string) => {
  return fetch(`${BITCOIN_INSIGHT_URL}/address/${address}/balance`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })
    .then(validateResponse('getAddressBalanceFromNode'));
};

export const getBTCTransactionsFromNode = (address: string) => {
  return fetch(`${BITCOIN_INSIGHT_URL}/address/${address}/txs?limit=0`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  }).then(validateResponse('getBTCTransactionsFromNode'))
    .then(response => response.json())
    .then(txs => {
      const fullTxs = txs.map(e => {
        return fetch(`${BITCOIN_INSIGHT_URL}/tx/${e.mintTxid}/populated`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        })
          .then(resp => resp.json())
          .then(txDetails => {
            e.details = txDetails;
            return e;
          })
          .catch(() => {
            e.details = null;
            return e;
          });
      });
      return Promise.all(fullTxs);
    });
};
