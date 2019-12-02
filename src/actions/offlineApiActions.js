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

import { ONLINE, OFFLINE, OFFLINE_API_CALL } from 'constants/offlineQueueConstants';

export const makeApiCall = (data: Object) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { method, params } = data.payload;
    return api[method](...params);
  };
};

export const updateOfflineQueueNetworkStatusAction = (isOnline: boolean) => ({
  type: isOnline ? ONLINE : OFFLINE,
});

export const offlineApiCall = (method: string, ...params: any) => ({
  type: OFFLINE_API_CALL,
  payload: {
    method,
    params,
  },
  meta: {
    queueIfOffline: true,
    timestamp: +new Date(),
  },
});
