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

// actions
import { estimateTransactionAction } from 'actions/transactionEstimateActions';
import { saveDbAction } from 'actions/dbActions';

// constants
import { SET_ESTIMATING_TRANSACTION } from 'constants/transactionEstimateConstants';
import { SET_STREAMS, SET_FETCHING_STREAMS, SET_SABLIER_GRAPH_QUERY_ERROR } from 'constants/sablierConstants';

// utils
import { findFirstSmartAccount, getAccountAddress } from 'utils/accounts';

// services
import {
  fetchUserStreams,
  getSablierCancellationTransaction,
  getSablierWithdrawTransaction,
} from 'services/sablier';
import { GraphQueryError } from 'services/theGraph';

// types
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
    const streams = await fetchUserStreams(getAccountAddress(smartWalletAccount))
      .catch(error => {
        if (error instanceof GraphQueryError) {
          dispatch({ type: SET_SABLIER_GRAPH_QUERY_ERROR });
        }

        return null;
      });
    if (streams) dispatch(setUserStreamsAction(streams));
  };
};

export const calculateSablierWithdrawTransactionEstimateAction = (
  stream: Stream,
  amount: number,
  asset: Asset,
) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = findFirstSmartAccount(accounts);
    if (!smartWalletAccount) return;

    dispatch({ type: SET_ESTIMATING_TRANSACTION, payload: true });

    const { to: recipient, amount: value, data } = getSablierWithdrawTransaction(
      getAccountAddress(smartWalletAccount),
      amount,
      asset,
      stream,
    );

    dispatch(estimateTransactionAction(recipient, value, data));
  };
};

export const calculateSablierCancelTransactionEstimateAction = (stream: Stream) => {
  return (dispatch: Dispatch) => {
    dispatch({ type: SET_ESTIMATING_TRANSACTION, payload: true });

    const { to, data } = getSablierCancellationTransaction(stream);

    dispatch(estimateTransactionAction(to, 0, data));
  };
};
