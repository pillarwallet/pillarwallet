// @flow
import { CACHE_STATUS, SET_CACHE_MAP } from 'constants/cacheConstants';

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
  isChanging: false,
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
    case SET_CACHE_MAP:
      return { ...state, cacheMap: action.payload };
      // REMOVE CACHE
    default:
      return state;
  }
}
