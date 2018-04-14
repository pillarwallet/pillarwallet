// @flow
import { UPDATE_ASSET, UPDATE_ASSETS_STATE, FETCHED } from 'constants/assetsConstants';
import merge from 'lodash.merge';

export type AssetsReducerState = {
  data: Object,
  assetsState: ?string
}

export type AssetsReducerAction = {
  type: string,
  payload: Object
}

const initialState = {
  data: {},
  assetsState: null
}

export default function assetsReducer(
  state: AssetsReducerState = initialState,
  action: AssetsReducerAction
){
  switch (action.type) {
    case UPDATE_ASSETS_STATE:
      return { ...state, assetsState: action.payload }
    case UPDATE_ASSET:
      const { id } = action.payload;
      const updatedState = {
        data: { [id]: { ...action.payload } }
      }
      return merge(
        state,
        updatedState
      )
    default:
      return state;
  }
}
