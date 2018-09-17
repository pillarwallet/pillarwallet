// @flow
import { SET_ICOS, ICO } from 'constants/marketConstants';
import type { ICO as ICOT } from 'models/ICO';
import merge from 'lodash.merge';

type Marketplace = {
  [string]: Object[],
}

export type MarketReducerState = {
  data: Marketplace,
}

export type MarketReducerAction = {
  type: string,
  payload: any,
}

const initialState = {
  data: {
    [ICO]: [],
  },
};

export default function invitationsReducer(
  state: MarketReducerState = initialState,
  action: MarketReducerAction,
) {
  switch (action.type) {
    case SET_ICOS:
      const icos: ICOT = action.payload;
      return merge({}, state, { data: { [ICO]: icos } });
    default:
      return state;
  }
}
