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
import { SET_PILLARX_ADDRESS, RESET_PILLARX_ADDRESS } from 'constants/modularSdkConstants';

export type ModularSdkReducerState = {
  pillarXAddress: string;
};

export type ModularSdkReducerAction = {
  type: string;
  payload: any;
};

const initialState = {
  pillarXAddress: '',
};

const modularSdkReducer = (
  state: ModularSdkReducerState = initialState,
  action: ModularSdkReducerAction,
): ModularSdkReducerState => {
  switch (action.type) {
    case SET_PILLARX_ADDRESS:
      return {
        ...state,
        pillarXAddress: action.payload,
      };
    case RESET_PILLARX_ADDRESS:
      return {
        ...state,
        pillarXAddress: '',
      };
    default:
      return state;
  }
};

export default modularSdkReducer;
