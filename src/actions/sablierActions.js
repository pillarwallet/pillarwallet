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
import {
  SET_STREAMS,
  SET_FETCHING_STREAMS,
  SET_CALCULATING_SABLIER_WITHDRAW_TRANSACTION_ESTIMATE,
  SET_SABLIER_WITHDRAW_TRANSACTION_ESTIMATE,
  SET_EXECUTING_SABLIER_APPROVE,
  SET_DISMISS_SABLIER_APPROVE,
} from 'constants/sablierConstants';
import { TX_CONFIRMED_STATUS, TX_FAILED_STATUS } from 'constants/historyConstants';
import { saveDbAction } from 'actions/dbActions';
import Toast from 'components/Toast';
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
    dispatch(setUserStreamsAction(streams));
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
      .catch(() => null);

    dispatch({ type: SET_SABLIER_WITHDRAW_TRANSACTION_ESTIMATE, payload: estimate });
  };
};

export const setExecutingSablierApproveAction = (assetSymbol: string, txHash: string) => ({
  type: SET_EXECUTING_SABLIER_APPROVE,
  payload: { assetSymbol, txHash },
});

export const setDismissSablierApproveAction = (assetSymbol: string) => ({
  type: SET_DISMISS_SABLIER_APPROVE,
  payload: assetSymbol,
});

export const checkSablierApprovalTransactionAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      history: {
        data: transactionsHistory,
      },
      sablier: {
        sablierApproveExecuting,
      },
    } = getState();

    Object.keys(sablierApproveExecuting).forEach((symbol: string) => {
      const txHash = sablierApproveExecuting[symbol];
      if (txHash) {
        const accountIds = Object.keys(transactionsHistory);
        const allHistory: Object[] = accountIds.reduce(
          (existing = [], accountId) => {
            const walletAssetsHistory = transactionsHistory[accountId] || [];
            return [...existing, ...walletAssetsHistory];
          },
          [],
        );
        const allowanceTransaction = allHistory.find(({ hash = null }) => hash === txHash);
        if (allowanceTransaction) {
          if (allowanceTransaction.status === TX_CONFIRMED_STATUS) {
            dispatch(setDismissSablierApproveAction(symbol));
            Toast.show({
              message: `Sablier ${symbol} allowance was enabled`,
              type: 'success',
              title: 'Success',
              autoClose: true,
            });
          } else if (allowanceTransaction.status === TX_FAILED_STATUS) {
            dispatch(setDismissSablierApproveAction(symbol));
            Toast.show({
              message: `Sablier ${symbol} allowance transaction failed`,
              type: 'warning',
              title: 'Transaction failed',
              autoClose: true,
            });
          }
        }
      }
    });
  };
};
