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
import { OFFLINE, OFFLINE_API_CALL, ONLINE } from 'constants/offlineQueueConstants';
import { makeApiCall, offlineApiCall, updateOfflineQueueNetworkStatusAction } from '../offlineApiActions';

describe('Offline api Actions', () => {
  const api = {
    userInfo: jest.fn(),
  };
  const dispatchMock = jest.fn();
  const getState = jest.fn();

  afterEach(() => {
    dispatchMock.mockClear();
  });

  describe('makeApiCall()', () => {
    it('should call passed api method with provided params', async () => {
      const action = {
        payload: {
          method: 'userInfo',
          params: [1, 2],
        },
      };
      await makeApiCall(action)(dispatchMock, getState, api);
      expect(api.userInfo).toBeCalledWith(1, 2);
    });
  });

  describe('updateOfflineQueueNetworkStatusAction()', () => {
    it('should dispatch ONLINE type when user is online', () => {
      expect(updateOfflineQueueNetworkStatusAction(true)).toEqual({
        type: ONLINE,
      });
    });
    it('should dispatch OFFLINE type when user is online', () => {
      expect(updateOfflineQueueNetworkStatusAction(false)).toEqual({
        type: OFFLINE,
      });
    });
  });

  describe('offlineApiCall()', () => {
    it('should dispatch OFFLINE_API_CALL action', () => {
      expect(offlineApiCall('test', 1, 2)).toMatchObject({
        type: OFFLINE_API_CALL,
        payload: {
          method: 'test',
          params: [1, 2],
        },
        meta: {
          queueIfOffline: true,
        },
      });
    });
  });
});
