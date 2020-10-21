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
  fetchUserStreams,
  getSablierWithdrawTransaction,
} from 'services/sablier';
import smartWalletService from 'services/smartWallet';
import { findFirstSmartAccount, getAccountAddress } from 'utils/accounts';
import { reportErrorLog } from 'utils/common';
import {
  SET_STREAMS,
  SET_FETCHING_STREAMS,
  SET_CALCULATING_SABLIER_WITHDRAW_TRANSACTION_ESTIMATE,
  SET_SABLIER_WITHDRAW_TRANSACTION_ESTIMATE,
} from 'constants/sablierConstants';
import { saveDbAction } from 'actions/dbActions';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { Streams, Stream } from 'models/Sablier';
import type { Asset } from 'models/Asset';


export const setUserStreamsAction = (streams: Streams) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_STREAMS, payload: streams });
    dispatch(saveDbAction('sablier', streams, true));
  };
};

export const fetchUserStreamsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
    } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch({ type: SET_FETCHING_STREAMS });
    const streams = await fetchUserStreams(getAccountAddress(smartWalletAccount));
    if (streams) dispatch(setUserStreamsAction(streams));
  };
};

export const calculateSablierWithdrawTransactionEstimateAction = (
  stream: Stream,
  amount: number,
  asset: Asset,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch({ type: SET_CALCULATING_SABLIER_WITHDRAW_TRANSACTION_ESTIMATE });

    const { to: recipient, amount: value, data } = getSablierWithdrawTransaction(
      getAccountAddress(smartWalletAccount),
      amount,
      asset,
      stream,
    );

    const estimate = await smartWalletService
      .estimateAccountTransaction({ recipient, value, data })
      .catch((e) => {
        reportErrorLog('Error getting sablier withdraw transaction estimate', { message: e.message });
        return null;
      });

    dispatch({ type: SET_SABLIER_WITHDRAW_TRANSACTION_ESTIMATE, payload: estimate });
  };
};

