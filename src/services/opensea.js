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
import { getEnv } from 'configs/envConfig';

// services
import { API_REQUEST_TIMEOUT } from './api';


const requestConfig = {
  timeout: API_REQUEST_TIMEOUT,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-API-KEY': getEnv().OPEN_SEA_API_KEY,
  },
};

export const getLimitedData =
  (url: string, data: Array<Object>, limit: number, offset: number,
    responseDataKey: string, resolve: Function, reject: Function) => {
    axios.get(`${url}&limit=${limit}&offset=${offset}`, requestConfig) // eslint-disable-line i18next/no-literal-string, max-len
      .then(({ data: responseData }: AxiosResponse) => {
        const retrievedData = data.concat(responseData[responseDataKey]);
        const newOffset = offset + limit;
        if (responseData[responseDataKey].length === limit) {
          setTimeout(() => {
            getLimitedData(`${url}&limit=${limit}&offset=${newOffset}`, // eslint-disable-line i18next/no-literal-string, max-len
              retrievedData, limit, newOffset, responseDataKey, resolve, reject);
          }, 1000);
        } else {
          setTimeout(() => {
            resolve(retrievedData);
          }, 1000);
        }
      })
      .catch(error => { reject(error); });
  };
