// @flow
import { ADD_ACCOUNT, UPDATE_ACCOUNTS } from 'constants/accountsConstants';
import type { Accounts } from 'models/Account';

export type AccountsReducerState = {
  data: Accounts,
};

export type AccountsAction = {
  type: string,
  payload: any,
};

export const initialState = {
  data: [],
};

export default function accountsReducer(
  state: AccountsReducerState = initialState,
  action: AccountsAction,
): AccountsReducerState {
  switch (action.type) {
    case UPDATE_ACCOUNTS:
      return { ...state, data: action.payload };
    case ADD_ACCOUNT:
      return { ...state, data: [...state.data, action.payload] };
    default:
      return state;
  }
}
