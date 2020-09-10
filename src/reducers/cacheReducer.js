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

import { CACHE_STATUS, REMOVE_URL_CACHE, SET_CACHE_MAP } from 'constants/cacheConstants';

type CacheStatus =
  typeof CACHE_STATUS.REQUESTED |
  typeof CACHE_STATUS.PENDING |
  typeof CACHE_STATUS.DONE |
  typeof CACHE_STATUS.FAILED;


// todo: add expiration
type CacheData = {
  status: CacheStatus,
  localUrl?: ?string,
}
export type CacheMap = {
  [urlAsKey: string]: ?CacheData;
}

export type CacheReducerState = {
  cacheMap: CacheMap
};

export type CacheAction = {
  type: string,
  payload: any,
};

export const initialState = {
  cacheMap: {},
};

const setCacheStatus = (
  state: CacheReducerState,
  urlAsKey: string,
  status: CacheStatus,
  localUrl?: ?string,
): CacheReducerState => {
  return {
    ...state,
    cacheMap: {
      ...state.cacheMap,
      [urlAsKey]: { status, localUrl },
    },
  };
};

export default function cacheReducer(
  state: CacheReducerState = initialState,
  action: CacheAction,
): CacheReducerState {
  switch (action.type) {
    case CACHE_STATUS.PENDING:
      return setCacheStatus(state, action.payload.url, action.type);
    case CACHE_STATUS.DONE:
      return setCacheStatus(state, action.payload.url, CACHE_STATUS.DONE, action.payload.localUrl);
    case CACHE_STATUS.FAILED:
      return setCacheStatus(state, action.payload.url, CACHE_STATUS.FAILED, null);
    case REMOVE_URL_CACHE:
      return {
        ...state,
        cacheMap: Object.keys(state.cacheMap).reduce((caches, url) => {
          if (url !== action.payload) {
            caches[url] = state.cacheMap[url];
          }
          return caches;
        }, {}),
      };
    case SET_CACHE_MAP:
      return { ...state, cacheMap: action.payload };
    default:
      return state;
  }
}
