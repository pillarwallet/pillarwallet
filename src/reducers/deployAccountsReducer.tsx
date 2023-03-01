// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import type { Chain } from 'models/Chain';

import { DEPLOY_ACCOUNTS, DEPLOY_ACCOUNTS_FETCHING } from 'constants/accountsConstants';

type DeployData = {
  chain: Chain;
  status: string;
};

export type DeployAccountsReducerState = {
  data: DeployData[];
  isFetching: boolean;
};

export type DeployAccountsAction = {
  type: string;
  payload: any;
};

export const initialState = {
  data: [],
  isFetching: false,
};

export default function deployAccountsReducer(
  state: DeployAccountsReducerState = initialState,
  action: DeployAccountsAction,
): DeployAccountsReducerState {
  switch (action.type) {
    case DEPLOY_ACCOUNTS_FETCHING:
      return { ...state, isFetching: action.payload };
    case DEPLOY_ACCOUNTS:
      return { ...state, data: action.payload };
    default:
      return state;
  }
}
