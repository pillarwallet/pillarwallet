// @flow
import { UPDATE_COLLECTIBLES } from 'constants/collectiblesConstants';

export type CollectiblesReducerState = {
  assets: Object[],
  categories: Object[],
};

export type CollectiblesReducerAction = {
  type: string,
  payload: any,
};

const initialState = {
  assets: [],
  categories: [],
};

export default function assetsReducer(
  state: CollectiblesReducerState = initialState,
  action: CollectiblesReducerAction,
) {
  switch (action.type) {
    case UPDATE_COLLECTIBLES:
      return {
        ...state,
        assets: action.payload.assets,
        categories: action.payload.categories,
      };
    default:
      return state;
  }
}
