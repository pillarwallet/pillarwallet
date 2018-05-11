// @flow
import {
  UPDATE_ASSET,
  UPDATE_ASSETS,
  UPDATE_ASSETS_STATE,
  UPDATE_ASSETS_BALANCES,
  FETCHED,
} from 'constants/assetsConstants';
import { transformAssetsToObject } from 'utils/assets';
import merge from 'lodash.merge';

export type AssetsReducerState = {
  data: Object,
  assetsState: ?string,
};

export type AssetsReducerAction = {
  type: string,
  payload: any,
};

const initialState = {
  data: {},
  assetsState: null,
};

export default function assetsReducer(
  state: AssetsReducerState = initialState,
  action: AssetsReducerAction,
) {
  switch (action.type) {
    case UPDATE_ASSETS_STATE:
      return { ...state, assetsState: action.payload };
    case UPDATE_ASSET:
      const { symbol } = action.payload;
      const updatedState = {
        data: { [symbol]: { ...state.data[symbol], ...action.payload } },
      };
      return merge(
        {},
        state,
        updatedState,
      );
    case UPDATE_ASSETS:
      return { ...state, data: action.payload };
    case UPDATE_ASSETS_BALANCES:
      const mappedAssets = transformAssetsToObject(action.payload);
      return merge(
        {},
        state,
        { assetsState: FETCHED },
        { data: mappedAssets },
      );
    default:
      return state;
  }
}
