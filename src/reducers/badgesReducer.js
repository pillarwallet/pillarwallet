// @flow
import { UPDATE_BADGES } from 'constants/badgesConstants';

export type BadgesReducerState = {
  data: Object,
};

export type BadgesReducerAction = {
  type: string,
  payload: any,
};

const initialState = {
  data: {},
};

export default function badgesReducer(
  state: BadgesReducerState = initialState,
  action: BadgesReducerAction,
) {
  switch (action.type) {
    case UPDATE_BADGES:
      return {
        ...state,
        data: action.payload,
      };
    default:
      return state;
  }
}
