// @flow
import { UPDATE_SESSION } from 'constants/sessionConstants';
import merge from 'lodash.merge';

export type SessionReducerState = {
  data: Object,
}

export type SessionReducerAction = {
  type: string,
  payload: any
}

const initialState = {
  data: {
    isOnline: true,
    hasDBConflicts: false,
  },
};

export default function appSettingsReducer(
  state: SessionReducerState = initialState,
  action: SessionReducerAction,
) {
  switch (action.type) {
    case UPDATE_SESSION:
      return merge(
        {},
        state,
        { data: action.payload },
      );
    default:
      return state;
  }
}
