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
import { SET_FETCHING_UNIPOOL_DATA, SET_UNIPOOL_DATA } from 'constants/liquidityPoolsConstants';
import { getStakedAmount, getEarnedAmount } from 'utils/unipool';
import { findFirstSmartAccount, getAccountAddress } from 'utils/accounts';
import { reportErrorLog } from 'utils/common';
import type { Dispatch, GetState } from 'reducers/rootReducer';


export const fetchUnipoolUserDataAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
    } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch({ type: SET_FETCHING_UNIPOOL_DATA, payload: true });
    const [stakedAmount, earnedAmount] = await Promise.all([
      getStakedAmount(getAccountAddress(smartWalletAccount)),
      getEarnedAmount(getAccountAddress(smartWalletAccount)),
    ]).catch(error => {
      reportErrorLog('Unipool service failed', { error });
      return [];
    });

    if (stakedAmount && earnedAmount) {
      dispatch({
        type: SET_UNIPOOL_DATA,
        payload: {
          stakedAmount,
          earnedAmount,
        },
      });
    }
    dispatch({ type: SET_FETCHING_UNIPOOL_DATA, payload: false });
  };
};
