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

import { toChecksumAddress } from '@netgum/utils';
import uniq from 'lodash.uniq';
import t from 'translations/translate';
import axios from 'axios';

// components
import Toast from 'components/Toast';

// constants
import {
  RESET_OFFERS,
  ADD_OFFER,
  SET_EXCHANGE_SEARCH_REQUEST,
  SET_EXECUTING_TRANSACTION,
  SET_DISMISS_TRANSACTION,
  ADD_EXCHANGE_ALLOWANCE,
  UPDATE_EXCHANGE_ALLOWANCE,
  MARK_NOTIFICATION_SEEN,
  SET_EXCHANGE_SUPPORTED_ASSETS,
  PROVIDER_UNISWAP,
  PROVIDER_1INCH,
  PROVIDER_SYNTHETIX,
  SET_WBTC_FEES,
  SET_UNISWAP_TOKENS_QUERY_STATUS,
  UNISWAP_TOKENS_QUERY_STATUS,
  ADD_WBTC_PENDING_TRANSACTION,
  SET_WBTC_PENDING_TRANSACTIONS,
  ADD_WBTC_SETTLED_TRANSACTION,
} from 'constants/exchangeConstants';
import { TX_CONFIRMED_STATUS } from 'constants/historyConstants';

// utils
import { getSmartWalletAddress } from 'utils/accounts';
import { reportErrorLog, reportLog } from 'utils/common';
import { getAssetsAsList, getAssetData, isSynthetixTx } from 'utils/assets';
import { isOrderAmountTooLow } from 'utils/exchange';

// selectors
import { accountAssetsSelector } from 'selectors/assets';

// services
import {
  getUniswapOffer, createUniswapOrder, createUniswapAllowanceTx, fetchUniswapSupportedTokens,
} from 'services/uniswap';
import { get1inchOffer, create1inchOrder, create1inchAllowanceTx, fetch1inchSupportedTokens } from 'services/1inch';
import { getSynthetixOffer, createSynthetixAllowanceTx, createSynthetixOrder } from 'services/synthetix';
import { API_REQUEST_TIMEOUT } from 'services/api';
import {
  mapFetchedWbtcTransactionToTransaction, fetchWBTCCafeTransactions, getValidPendingTransactions,
} from 'services/wbtcCafe';
import { getEnv } from 'configs/envConfig';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { Asset } from 'models/Asset';
import type { AllowanceTransaction } from 'models/Transaction';
import type {
  WBTCGatewayAddressParams, WBTCGatewayAddressResponse, PendingWBTCTransaction, FetchedWBTCTx,
} from 'models/WBTC';
import type SDKWrapper from 'services/api';

// actions
import { saveDbAction } from './dbActions';

export const takeOfferAction = (
  fromAsset: Asset,
  toAsset: Asset,
  fromAmount: string,
  provider: string,
  trackId: string,
  askRate: string | number,
  callback: Object => void,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
    } = getState();

    const clientAddress = toChecksumAddress(getSmartWalletAddress(accounts));

    let order;
    if (provider === PROVIDER_UNISWAP) {
      order = await createUniswapOrder(fromAsset, toAsset, fromAmount, clientAddress);
    } else if (provider === PROVIDER_1INCH) {
      order = await create1inchOrder(fromAsset, toAsset, fromAmount, clientAddress);
    } else if (provider === PROVIDER_SYNTHETIX) {
      order = await createSynthetixOrder(fromAsset, toAsset, fromAmount, clientAddress);
    }

    if (!fromAsset || !toAsset || !order) {
      reportErrorLog('Cannot find exchange asset');
      callback({});
      return;
    }

    if (isOrderAmountTooLow(askRate, fromAmount, order)) {
      reportLog('Offer output amount and order output amount diverged');
      Toast.show({ message: t('error.exchange.exchangeFailed'), emoji: 'hushed' });
      callback({});
      return;
    }

    const { address: fromAssetAddress } = fromAsset;
    const { decimals: fromAssetDecimals } = fromAsset;

    const transactionData = {
      fromAsset,
      toAsset,
      from: getSmartWalletAddress(accounts),
      payQuantity: fromAmount,
      amount: fromAmount,
      symbol: fromAsset.symbol,
      contractAddress: fromAssetAddress || '',
      decimals: parseInt(fromAssetDecimals, 10) || 18,
      ...order.transactionObj,
    };
    callback(transactionData);
  };
};

export const resetOffersAction = () => ({ type: RESET_OFFERS });

const searchUniswapAction = (fromAsset: Asset, toAsset: Asset, fromAmount: string, clientAddress: string) => {
  return async (dispatch: Dispatch) => {
    const offer = await getUniswapOffer(fromAsset, toAsset, fromAmount, clientAddress);
    if (offer) dispatch({ type: ADD_OFFER, payload: offer });
  };
};

const search1inchAction = (fromAsset: Asset, toAsset: Asset, fromAmount: string, clientAddress: string) => {
  return async (dispatch: Dispatch) => {
    const offer = await get1inchOffer(fromAsset, toAsset, fromAmount, clientAddress);
    if (offer) dispatch({ type: ADD_OFFER, payload: offer });
  };
};

const estimateSynthetixTxAction = (fromAsset: Asset, toAsset: Asset, fromAmount: string, clientAddress: string) => {
  return async (dispatch: Dispatch) => {
    const offer = await getSynthetixOffer(fromAsset, toAsset, fromAmount, clientAddress);
    if (offer) dispatch({ type: ADD_OFFER, payload: offer });
  };
};

export const searchOffersAction = (fromAssetCode: string, toAssetCode: string, fromAmount: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      exchange: { exchangeSupportedAssets },
      accounts: { data: accounts },
    } = getState();

    // let's put values to reducer in order to see the previous offers and search values after app gets locked
    dispatch({
      type: SET_EXCHANGE_SEARCH_REQUEST,
      payload: {
        fromAssetCode,
        toAssetCode,
        fromAmount,
      },
    });

    const fromAsset = exchangeSupportedAssets.find(a => a.symbol === fromAssetCode);
    const toAsset = exchangeSupportedAssets.find(a => a.symbol === toAssetCode);
    if (!fromAsset || !toAsset) {
      reportErrorLog('Cannot find exchange asset', { fromAssetCode, toAssetCode });
      return;
    }

    const clientAddress = toChecksumAddress(getSmartWalletAddress(accounts));

    if (isSynthetixTx(fromAsset, toAsset)) {
      dispatch(estimateSynthetixTxAction(fromAsset, toAsset, fromAmount, clientAddress));
    } else {
      dispatch(search1inchAction(fromAsset, toAsset, fromAmount, clientAddress));
      dispatch(searchUniswapAction(fromAsset, toAsset, fromAmount, clientAddress));
    }
  };
};

export const setExecutingTransactionAction = () => ({
  type: SET_EXECUTING_TRANSACTION,
});

export const setDismissTransactionAction = () => ({
  type: SET_DISMISS_TRANSACTION,
});

export const setTokenAllowanceAction = (
  fromAssetAddress: string,
  provider: string,
  callback: Function,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
    } = getState();

    const clientAddress = getSmartWalletAddress(accounts);
    let txData: ?AllowanceTransaction = null;
    if (provider === PROVIDER_UNISWAP) {
      txData = await createUniswapAllowanceTx(fromAssetAddress, clientAddress || '');
    } else if (provider === PROVIDER_1INCH) {
      txData = await create1inchAllowanceTx(fromAssetAddress, clientAddress || '');
    } else if (provider === PROVIDER_SYNTHETIX) {
      txData = await createSynthetixAllowanceTx(fromAssetAddress, clientAddress || '');
    }

    if (!txData) {
      Toast.show({
        message: t('toast.exchangeAllowanceFailed'),
        emoji: 'hushed',
        supportLink: true,
      });
      return;
    }

    const { to: payToAddress, data } = txData;
    callback({
      payToAddress,
      transactionObj: {
        data,
      },
    });
  };
};

export const addExchangeAllowanceAction = (
  provider: string,
  fromAssetCode: string,
  toAssetCode: string,
  transactionHash: string,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { exchange: { data: { allowances: _allowances = [] } } } = getState();
    const allowance = {
      provider,
      fromAssetCode,
      toAssetCode,
      transactionHash,
      enabled: false,
    };

    // filter pending for current provider and asset match to override failed transactions
    const allowances = _allowances
      .filter(({ provider: _provider, fromAssetCode: _fromAssetCode, toAssetCode: _toAssetCode }) =>
        fromAssetCode !== _fromAssetCode && toAssetCode !== _toAssetCode && provider !== _provider,
      );

    allowances.push(allowance);

    dispatch({
      type: ADD_EXCHANGE_ALLOWANCE,
      payload: allowance,
    });
    dispatch(saveDbAction('exchangeAllowances', { allowances }, true));
  };
};

export const enableExchangeAllowanceByHashAction = (transactionHash: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { exchange: { data: { allowances: _allowances = [] } } } = getState();
    const allowance = _allowances.find(
      ({ transactionHash: _transactionHash }) => _transactionHash === transactionHash,
    );
    if (!allowance) return;
    const updatedAllowance = {
      ...allowance,
      enabled: true,
    };
    dispatch({
      type: UPDATE_EXCHANGE_ALLOWANCE,
      payload: updatedAllowance,
    });
    const allowances = _allowances
      .filter(
        ({ transactionHash: _transactionHash }) => _transactionHash !== transactionHash,
      );
    allowances.push(updatedAllowance);
    dispatch(saveDbAction('exchangeAllowances', { allowances }, true));
  };
};

export const checkEnableExchangeAllowanceTransactionsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      history: {
        data: transactionsHistory,
      },
      exchange: {
        data: {
          allowances: exchangeAllowances,
        },
      },
      assets: {
        supportedAssets,
      },
    } = getState();
    const currentAccountAssets = accountAssetsSelector(getState());
    const accountIds = Object.keys(transactionsHistory);
    const allHistory = accountIds.reduce(
      (existing = [], accountId) => {
        const walletAssetsHistory = transactionsHistory[accountId] || [];
        return [...existing, ...walletAssetsHistory];
      },
      [],
    );
    exchangeAllowances
      .filter(({ enabled }) => !enabled)
      .map(({ transactionHash, fromAssetCode, toAssetCode }) => {  // eslint-disable-line
        const enabledAllowance = allHistory.find(
          // $FlowFixMe
          ({ hash, status }) => hash === transactionHash && status === TX_CONFIRMED_STATUS,
        );
        if (enabledAllowance) {
          const fromAssetData = getAssetData(getAssetsAsList(currentAccountAssets), supportedAssets, fromAssetCode);
          const toAssetData = getAssetData(getAssetsAsList(currentAccountAssets), supportedAssets, toAssetCode);
          Toast.show({
            message: t('toast.exchangeEnabled', {
              fromAssetName: fromAssetData.name,
              fromAssetSymbol: fromAssetData.symbol,
              toAssetName: toAssetData.name,
              toAssetSymbol: toAssetData.symbol,
            }),
            emoji: 'handshake',
            autoClose: true,
          });
          dispatch(enableExchangeAllowanceByHashAction(transactionHash));
        }
      });
  };
};

export const markNotificationAsSeenAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: MARK_NOTIFICATION_SEEN,
    });
  };
};

export const getExchangeSupportedAssetsAction = (callback?: () => void) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      assets: { supportedAssets },
      exchange: { exchangeSupportedAssets: _exchangeSupportedAssets },
    } = getState();

    dispatch({
      type: SET_UNISWAP_TOKENS_QUERY_STATUS,
      payload: { status: UNISWAP_TOKENS_QUERY_STATUS.FETCHING },
    });

    const oneInchAssetsSymbols = fetch1inchSupportedTokens();
    const uniswapAssetsSymbols = fetchUniswapSupportedTokens();

    const assetsSymbols = await Promise.all([oneInchAssetsSymbols, uniswapAssetsSymbols]);

    const fetchOneInchSuccess = Array.isArray(assetsSymbols[0]);
    const fetchUniswapSuccess = Array.isArray(assetsSymbols[1]);
    const fetchSuccess = fetchOneInchSuccess && fetchUniswapSuccess;

    if (!fetchUniswapSuccess) {
      dispatch({
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: UNISWAP_TOKENS_QUERY_STATUS.ERROR },
      });
    } else {
      dispatch({
        type: SET_UNISWAP_TOKENS_QUERY_STATUS,
        payload: { status: UNISWAP_TOKENS_QUERY_STATUS.SUCCESS },
      });
    }

    // if fetching failed and user can fall back to valid assets, no need to do anything
    if (_exchangeSupportedAssets?.length && !fetchSuccess) return;

    let fetchedAssetsSymbols: string[] = [];
    if (fetchSuccess) {
      fetchedAssetsSymbols = uniq(assetsSymbols[0].concat(assetsSymbols[1]));
    } else if (fetchOneInchSuccess) {
      fetchedAssetsSymbols = uniq(assetsSymbols[0]);
    } else if (fetchUniswapSuccess) {
      fetchedAssetsSymbols = uniq(assetsSymbols[1]);
    }

    if (!fetchedAssetsSymbols.length) {
      reportErrorLog('Failed to fetch exchange supported assets', null);
      return;
    }

    const exchangeSupportedAssets = fetchOneInchSuccess || fetchUniswapSuccess
      ? supportedAssets.filter(({ symbol, isSynthetixAsset }) =>
        isSynthetixAsset || fetchedAssetsSymbols.includes(symbol))
      : [];

    // there's no point in overwriting if results are empty
    if (exchangeSupportedAssets?.length) {
      dispatch({
        type: SET_EXCHANGE_SUPPORTED_ASSETS,
        payload: exchangeSupportedAssets,
      });
      dispatch(saveDbAction('exchangeSupportedAssets', { exchangeSupportedAssets }, true));
    } else {
      reportErrorLog('Failed to fetch exchange supported assets', null);
    }

    if (callback) callback();
  };
};

export const getWbtcFeesAction = () => (dispatch: Dispatch) => {
  axios.post(
    getEnv().WBTC_FEES_API,
    JSON.stringify({
      id: 67,
      jsonrpc: '2.0',
      method: 'ren_queryFees',
      params: {},
    }),
    {
      timeout: API_REQUEST_TIMEOUT,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    },
  )
    .then(res => { dispatch({ type: SET_WBTC_FEES, payload: res.data.result }); })
    .catch(e => { reportErrorLog('Failed to fetch WBTC fees', e); });
};

export const getWbtcGatewayAddressAction = (params: WBTCGatewayAddressParams) =>
  async (dispatch: Dispatch, getState: GetState, api: SDKWrapper): Promise<WBTCGatewayAddressResponse | null> => {
    const { user: { data: user }, accounts: { data: accounts } } = getState();
    const address = getSmartWalletAddress(accounts);
    const walletId = user?.walletId;
    if (!walletId || !address) return null;
    const gatewayAddressResponse = await api.getWbtcCafeGatewayAddress({ ...params, walletId, address });
    return gatewayAddressResponse;
  };

export const addWbtcPendingTxAction = (tx: PendingWBTCTransaction) => (dispatch: Dispatch, getState: GetState) => {
  dispatch({
    type: ADD_WBTC_PENDING_TRANSACTION,
    payload: tx,
  });
  const { exchange: { data: { pendingWbtcTransactions } } } = getState();
  dispatch(saveDbAction('pendingWbtcTransactions', { pendingWbtcTransactions }, true));
};

export const setWbtcPendingTxsAction = (pendingWbtcTransactions: PendingWBTCTransaction[]) => (dispatch: Dispatch) => {
  dispatch({
    type: SET_WBTC_PENDING_TRANSACTIONS,
    payload: pendingWbtcTransactions,
  });
  dispatch(saveDbAction('pendingWbtcTransactions', { pendingWbtcTransactions }, true));
};

export const addWbtcSettledTransactionAction = (transaction: FetchedWBTCTx) => (
  dispatch: Dispatch, getState: GetState,
) => {
  const mappedTx = mapFetchedWbtcTransactionToTransaction(transaction);

  dispatch({
    type: ADD_WBTC_SETTLED_TRANSACTION,
    payload: mappedTx,
  });
  const { exchange: { data: { settledWbtcTransactions, pendingWbtcTransactions } } } = getState();
  dispatch(saveDbAction('settledWbtcTransactions', { settledWbtcTransactions }, true));

  // find relevant pending tx by amount (get closest) and remove it
  if (!pendingWbtcTransactions.length) return;
  const amount = transaction.value / 100000000; // 8 decimals
  const searchedPendingAmount = pendingWbtcTransactions
    .map(p => p.amount)
    .reduce((a, b) => Math.abs(b - amount) < Math.abs(a - amount) ? b : a);
  const searchedPendingTx = pendingWbtcTransactions.find(pend => pend.amount === searchedPendingAmount);
  if (!searchedPendingTx) return;
  const filteredPending = pendingWbtcTransactions.filter(trx => trx.dateCreated !== searchedPendingTx.dateCreated);
  dispatch(setWbtcPendingTxsAction(filteredPending));
};

export const updatePendingWbtcTransactionsAction = () => (dispatch: Dispatch, getState: GetState) => {
  const { exchange: { data: { pendingWbtcTransactions } } } = getState();
  const validPending = getValidPendingTransactions(pendingWbtcTransactions);
  dispatch(setWbtcPendingTxsAction(validPending));
};

export const updateWBTCCafeTransactionsAction = () => async (dispatch: Dispatch, getState: GetState) => {
  const {
    accounts: { data: accounts },
    exchange: { data: { settledWbtcTransactions } },
  } = getState();
  const address = getSmartWalletAddress(accounts);
  if (!address) return;
  const fetchedWbtcTxs = await fetchWBTCCafeTransactions(address);

  if (fetchedWbtcTxs && fetchedWbtcTxs?.length) { // no need to do anything if no WBTC.Cafe txs were fetched
    const filteredWbtcTxs = // filter out those already in storage - only get new ones
      fetchedWbtcTxs.filter(fetched => !(settledWbtcTransactions.map(s => s.hash).includes(fetched.transactionHash)));
    filteredWbtcTxs.forEach(transaction => { dispatch(addWbtcSettledTransactionAction(transaction)); });
  }
  // at the end, kill old pending txs
  dispatch(updatePendingWbtcTransactionsAction());
};
