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

import { Configuration } from '@pillarwallet/pillarwallet-nodejs-sdk';
import { AxiosPromise } from 'axios';

const https = require('https');

const HttpEndpoints = {
  SEARCH_OFFERS: '/offers',
};

export default class ExchangeService extends Configuration {
  /**
   * @name mapIdentityKeys
   * @desc Maps the identity keys to a connection
   * @param {ConnectionMapIdentityKeys} mapIdentityKeysConfiguration
   * @returns {AxiosPromise}
   */
  mapIdentityKeys(params: ConnectionMapIdentityKeys): AxiosPromise {
    return this.executeRequest({
      params,
      defaultRequest: {
        url: '',
        method: 'GET',
        headers: {},
        params: {},
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      },
      schema: connectionCountSchema,
      url: `${Configuration.accessKeys.apiUrl}${
        HttpEndpoints.SEARCH_OFFERS
      }`,
    });
  }
}
