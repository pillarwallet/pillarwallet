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

import { CACHE_STATUS, REMOVE_URL_CACHE, SET_CACHED_URLS } from 'constants/cacheConstants';

type CacheStatus =
  typeof CACHE_STATUS.PENDING |
  typeof CACHE_STATUS.DONE |
  typeof CACHE_STATUS.FAILED;


// todo: add expiration
type CacheData = {
  status: CacheStatus,
  localPath?: ?string,
}
export type CachedUrls = {
  [urlAsKey: string]: ?CacheData;
}

export type CacheReducerState = {
  cachedUrls: CachedUrls
};

export type CacheAction = {
  type: string,
  payload: any,
};

export const initialState = {
  cachedUrls: {},
};

const setCacheStatus = (
  state: CacheReducerState,
  urlAsKey: string,
  status: CacheStatus,
  localPath?: ?string,
): CacheReducerState => {
  return {
    ...state,
    cachedUrls: {
      ...state.cachedUrls,
      [urlAsKey]: { status, localPath },
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
      return setCacheStatus(state, action.payload.url, CACHE_STATUS.DONE, action.payload.localPath);
    case CACHE_STATUS.FAILED:
      return setCacheStatus(state, action.payload.url, CACHE_STATUS.FAILED, null);
    case REMOVE_URL_CACHE:
      return {
        ...state,
        cachedUrls: Object.keys(state.cachedUrls).reduce((caches, url) => {
          if (url !== action.payload) {
            caches[url] = state.cachedUrls[url];
          }
          return caches;
        }, {}),
      };
    case SET_CACHED_URLS:
      return { ...state, cachedUrls: action.payload };
    default:
      return state;
  }
}
