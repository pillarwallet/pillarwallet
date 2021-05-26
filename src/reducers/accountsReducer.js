// @flow
import { ADD_ACCOUNT, UPDATE_ACCOUNTS, CHANGING_ACCOUNT } from 'constants/accountsConstants';
import type { Account } from 'models/Account';

export type AccountsReducerState = {
  data: Account[],
  isChanging: boolean,
};

export type AccountsAction = {
  type: string,
  payload: any,
};

export const initialState = {
  data: [],
  isChanging: false,
};

export default function accountsReducer(
  state: AccountsReducerState = initialState,
  action: AccountsAction,
): AccountsReducerState {
  switch (action.type) {
    case CHANGING_ACCOUNT:
      return { ...state, isChanging: action.payload };
    case UPDATE_ACCOUNTS:
      return { ...state, data: action.payload };
    case ADD_ACCOUNT:
      return { ...state, data: [...state.data, action.payload] };
    default:
      return state;
  }
}
