// @flow
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { SIMPLIFIED } from 'constants/assetsLayoutConstants';
import merge from 'lodash.merge';

export type AppSettingsReducerState = {
  data: Object,
  isFetched: boolean,
}

export type AppSettingsReducerAction = {
  type: string,
  payload: any
}

const initialState = {
  data: {
    lastTxSyncDatetime: 0,
    appearanceSettings: {
      assetsLayout: SIMPLIFIED,
    },
  },
  isFetched: false,
};

export default function appSettingsReducer(
  state: AppSettingsReducerState = initialState,
  action: AppSettingsReducerAction,
) {
  switch (action.type) {
    case UPDATE_APP_SETTINGS:
      const updatedState = { data: action.payload, isFetched: true };
      return merge(
        {},
        state,
        updatedState,
      );
    default:
      return state;
  }
}
