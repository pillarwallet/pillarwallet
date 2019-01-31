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
import { SET_ICOS, SET_ICO_FUNDING_INSTRUCTIONS } from 'constants/icosConstants';

export const fetchICOsAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { user: { data: { id: userId } } } = getState();
    const icos = await api.fetchICOs(userId);
    dispatch({
      type: SET_ICOS,
      payload: icos,
    });
  };
};

export const fetchICOFundingInstructionsAction = (currency: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { user: { data: { walletId } } } = getState();
    const instructions = await api.fetchICOFundingInstructions(walletId, currency);
    dispatch({
      type: SET_ICO_FUNDING_INSTRUCTIONS,
      payload: instructions,
    });
  };
};
