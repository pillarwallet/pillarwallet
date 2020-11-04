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

import RNFetchBlob from 'rn-fetch-blob';

import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { CachedUrls } from 'reducers/cacheReducer';
import { CACHE_STATUS, REMOVE_URL_CACHE } from 'constants/cacheConstants';
import { saveDbAction } from './dbActions';

const canStartCaching = (urlAsKey: string, cachedUrls: CachedUrls) => {
  const { status } = cachedUrls[urlAsKey] || {};
  return !status || status === CACHE_STATUS.FAILED;
};

const finishCachingAction = (url: string, path: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { cache: { cachedUrls } } = getState();

    dispatch({
      type: CACHE_STATUS.DONE,
      payload: {
        url,
        localPath: path,
      },
    });

    const updatedCachedUrls = {
      ...cachedUrls,
      [url]: {
        status: CACHE_STATUS.DONE,
        localPath: path,
      },
    };
    await dispatch(saveDbAction('cachedUrls', { cachedUrls: updatedCachedUrls }, true));
  };
};

export const cacheUrlAction = (url: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { cache: { cachedUrls } } = getState();
    if (canStartCaching(url, cachedUrls)) {
      dispatch({ type: CACHE_STATUS.PENDING, payload: { url } });
      await RNFetchBlob
        .config({
          fileCache: true,
          appendExt: 'json',
        })
        .fetch('GET', url)
        .then((res) => {
          if (res?.respInfo?.status === 200) {
            dispatch(finishCachingAction(url, res.path()));
          } else {
            dispatch({ type: CACHE_STATUS.FAILED, payload: { url } });
          }
        })
        .catch(() => {
          dispatch({ type: CACHE_STATUS.FAILED, payload: { url } });
        });
    }
  };
};

export const removeUrlCacheAction = (url: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { cache: { cachedUrls } } = getState();

    const updatedCachedUrls = Object.keys(cachedUrls).reduce((caches, mapKey) => {
      if (url !== mapKey) {
        caches[mapKey] = cachedUrls[mapKey];
      }
      return caches;
    }, {});

    await dispatch(saveDbAction('cachedUrls', { cachedUrls: updatedCachedUrls }, true));
    dispatch({ type: REMOVE_URL_CACHE, payload: url });
  };
};
