// @flow
import { UPDATE_BADGES } from 'constants/badgesConstants';
import merge from 'lodash.merge';

export type BadgesReducerState = {
  data: Object,
}

export type BadgesReducerAction = {
  type: string,
  payload: any,
}

const initialState = {
  data: {},
};

export default function badgesReducer(
  state: BadgesReducerState = initialState,
  action: BadgesReducerAction,
) {
  switch (action.type) {
    case UPDATE_BADGES:
      const updatedState = { data: action.payload };
      return merge(
        {},
        state,
        updatedState,
      );
    default:
      return state;
  }
}
