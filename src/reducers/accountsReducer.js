// @flow
import { ADD_ACCOUNT, UPDATE_ACCOUNTS } from 'constants/accountsConstants';
import type { Accounts } from 'models/Account';

export type AccountsState = {
  data: Accounts,
};

export type AccountsAction = {
  type: string,
  payload: any,
};

const initialState = {
  data: [],
};

export default function accountsReducer(
  state: AccountsState = initialState,
  action: AccountsAction,
) {
  switch (action.type) {
    case UPDATE_ACCOUNTS:
      return { ...state, data: action.payload };
    case ADD_ACCOUNT:
      return { ...state, data: [...state.data, action.payload] };
    default:
      return state;
  }
}
