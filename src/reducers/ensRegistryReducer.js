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
import {
  SET_ENS_REGISTRY_RECORDS,
  ADD_ENS_REGISTRY_RECORD,
  RESET_ENS_REGISTRY_DATA,
} from 'constants/ensRegistryConstants';

export type EnsRegistry = {
  [ethAddress: string]: string, // { [ethAddress]: ensName }
};

export type EnsRegistryReducerState = {
  data: EnsRegistry,
};

export type EnsRegistryReducerAction = {
  type: string,
  payload: any,
};

export const initialState = {
  data: {},
};

const ensRegistryReducer = (
  state: EnsRegistryReducerState = initialState,
  action: EnsRegistryReducerAction,
): EnsRegistryReducerState => {
  switch (action.type) {
    case SET_ENS_REGISTRY_RECORDS:
      return { ...state, data: action.payload };
    case ADD_ENS_REGISTRY_RECORD:
      return { ...state, data: { ...state.data, [action.payload.address]: action.payload.ensName } };
    case RESET_ENS_REGISTRY_DATA:
      return { ...initialState };
    default:
      return state;
  }
};

export default ensRegistryReducer;
