// @flow
import { SET_ICOS, SET_ICO_FUNDING_INSTRUCTIONS } from 'constants/icosConstants';
import type { ICO, ICOFundingInstructions } from 'models/ICO';

export type ICOsReducerState = {
  data: ICO[],
  instructions: ICOFundingInstructions | {},
}

export type ICOsReducerAction = {
  type: string,
  payload: any,
}

const initialState = {
  data: [],
  instructions: {},
};

export default function invitationsReducer(
  state: ICOsReducerState = initialState,
  action: ICOsReducerAction,
) {
  switch (action.type) {
    case SET_ICOS:
      const icos: ICO[] = state.data.concat(action.payload);
      return { ...state, data: icos };
    case SET_ICO_FUNDING_INSTRUCTIONS:
      const instructions: ICOFundingInstructions = action.payload;
      return { ...state, instructions };
    default:
      return state;
  }
}
