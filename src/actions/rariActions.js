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
  getRariFundBalanceInUSD,
  getRariAPY,
  getUserInterests,
  getAccountDepositInRSPT,
  getAccountDepositInUSD,
} from 'services/rari';
import {
  SET_RARI_FUND_BALANCE,
  SET_RARI_APY,
  SET_RARI_USER_DATA,
  SET_FETCHING_RARI_FUND_BALANCE,
  SET_FETCHING_RARI_APY,
  SET_FETCHING_RARI_USER_DATA,
} from 'constants/rariConstants';
import { findFirstSmartAccount, getAccountAddress } from 'utils/accounts';
import type { Dispatch, GetState } from 'reducers/rootReducer';


export const fetchRariFundBalanceAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_FETCHING_RARI_FUND_BALANCE });
    const rariFundBalance = await getRariFundBalanceInUSD();
    dispatch({ type: SET_RARI_FUND_BALANCE, payload: rariFundBalance });
  };
};

export const fetchRariAPYAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_FETCHING_RARI_APY });
    const rariAPY = await getRariAPY();
    dispatch({ type: SET_RARI_APY, payload: rariAPY });
  };
};

export const fetchRariUserDataAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
    } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;
    const smartWalletAddress = getAccountAddress(smartWalletAccount);

    dispatch({ type: SET_FETCHING_RARI_USER_DATA });

    const [userDepositInUSD, userDepositInRSPT, userInterests] = await Promise.all([
      getAccountDepositInUSD(smartWalletAddress),
      getAccountDepositInRSPT(smartWalletAddress),
      getUserInterests(smartWalletAddress),
    ]);

    dispatch({
      type: SET_RARI_USER_DATA,
      payload: {
        userDepositInUSD,
        userDepositInRSPT,
        userInterests: userInterests?.interests || 0,
        userInterestsPercentage: userInterests?.interestsPercentage || 0,
      },
    });
  };
};
