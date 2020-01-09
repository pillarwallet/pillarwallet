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
import axios, { AxiosResponse } from 'axios';
import { BITCOIN_INSIGHT_URL, BITCOIN_NETWORK } from 'react-native-dotenv';

import { defaultAxiosRequestConfig } from './api';

const requestConfig = {
  ...defaultAxiosRequestConfig,
  headers: {
    Accept: 'application/json',
  },
};

const postRequestConfig = {
  ...requestConfig,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};

const BTC_NET = BITCOIN_NETWORK === 'testnet' ? BITCOIN_NETWORK : 'mainnet';

const validateResponse = (name: string) => (response: AxiosResponse) => {
  if (response.status === 200) return response.data;
  const message = `${name} failed`;
  console.error(message, { response }); // eslint-disable-line no-console
  return new Error(message);
};

export const sendRawTransactionToNode = (rawtx: string) => axios
  .post(
    `${BITCOIN_INSIGHT_URL}/tx/send?chain=BTC&network=${BTC_NET}`,
    JSON.stringify({ rawTx: rawtx }),
    postRequestConfig,
  )
  .then(validateResponse('sendRawTransactionToNode'));

export const getAddressUtxosFromNode = (address: string) => axios
  .get(`${BITCOIN_INSIGHT_URL}/address/${address}/?unspent=true`, requestConfig)
  .then(validateResponse('getAddressUtxosFromNode'));

export const getAddressBalanceFromNode = (address: string) => axios
  .get(`${BITCOIN_INSIGHT_URL}/address/${address}/balance`, requestConfig)
  .then(validateResponse('getAddressBalanceFromNode'));

export const getBTCTransactionsFromNode = (address: string) => axios
  .get(`${BITCOIN_INSIGHT_URL}/address/${address}/txs?limit=0`, requestConfig)
  .then(validateResponse('getBTCTransactionsFromNode'))
  .then(txs => Promise.all(
    txs.map(e =>
      axios.get(`${BITCOIN_INSIGHT_URL}/tx/${e.mintTxid}/populated`, requestConfig)
        .then(({ data }: AxiosResponse) => data)
        .then(txDetails => ({ ...e, details: txDetails }))
        .catch(() => ({ ...e, details: null })),
    ),
  ));
