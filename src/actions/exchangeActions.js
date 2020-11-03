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
  SET_UNISWAP_TOKENS_QUERY_STATUS,
  UNISWAP_TOKENS_QUERY_STATUS,
} from 'constants/exchangeConstants';
import { TX_CONFIRMED_STATUS } from 'constants/historyConstants';

// utils
import { getSmartWalletAddress } from 'utils/accounts';
import { reportErrorLog } from 'utils/common';
import { getAssetsAsList, getAssetData, isSynthetixTx } from 'utils/assets';

// selectors
import { accountAssetsSelector } from 'selectors/assets';

// services
import {
  getUniswapOffer, createUniswapOrder, createUniswapAllowanceTx, fetchUniswapSupportedTokens,
} from 'services/uniswap';
import { get1inchOffer, create1inchOrder, create1inchAllowanceTx, fetch1inchSupportedTokens } from 'services/1inch';
import { getSynthetixOffer, createSynthetixAllowanceTx, createSynthetixOrder } from 'services/synthetix';
import { GraphQueryError } from 'services/theGraph';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { Asset } from 'models/Asset';
import type { AllowanceTransaction } from 'models/Transaction';

// actions
import { saveDbAction } from './dbActions';

export const takeOfferAction = (
  fromAsset: Asset,
  toAsset: Asset,
  fromAmount: number,
  provider: string,
  trackId: string,
  callback: Function,
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

const searchUniswapAction = (fromAsset: Asset, toAsset: Asset, fromAmount: number, clientAddress: string) => {
  return async (dispatch: Dispatch) => {
    const offer = await getUniswapOffer(fromAsset, toAsset, fromAmount, clientAddress);
    if (offer) dispatch({ type: ADD_OFFER, payload: offer });
  };
};

const search1inchAction = (fromAsset: Asset, toAsset: Asset, fromAmount: number, clientAddress: string) => {
  return async (dispatch: Dispatch) => {
    const offer = await get1inchOffer(fromAsset, toAsset, fromAmount, clientAddress);
    if (offer) dispatch({ type: ADD_OFFER, payload: offer });
  };
};

const estimateSynthetixTxAction = (fromAsset: Asset, toAsset: Asset, fromAmount: number, clientAddress: string) => {
  return async (dispatch: Dispatch) => {
    const offer = await getSynthetixOffer(fromAsset, toAsset, fromAmount, clientAddress);
    if (offer) dispatch({ type: ADD_OFFER, payload: offer });
  };
};

export const searchOffersAction = (fromAssetCode: string, toAssetCode: string, fromAmount: number) => {
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
    } = getState();

    dispatch({
      type: SET_UNISWAP_TOKENS_QUERY_STATUS,
      payload: { status: UNISWAP_TOKENS_QUERY_STATUS.FETCHING },
    });

    const oneInchAssetsSymbols = fetch1inchSupportedTokens();
    const uniswapAssetsSymbols = fetchUniswapSupportedTokens(supportedAssets.map(({ symbol }) => symbol))
      .then(result => {
        dispatch({
          type: SET_UNISWAP_TOKENS_QUERY_STATUS,
          payload: { status: UNISWAP_TOKENS_QUERY_STATUS.SUCCESS },
        });
        return result;
      })
      .catch(error => {
        if (error instanceof GraphQueryError) {
          dispatch({
            type: SET_UNISWAP_TOKENS_QUERY_STATUS,
            payload: { status: UNISWAP_TOKENS_QUERY_STATUS.ERROR },
          });
        }

        return [];
      });

    const assetsSymbols = await Promise.all([oneInchAssetsSymbols, uniswapAssetsSymbols]);

    const fetchSuccess: boolean = Array.isArray(assetsSymbols[0]) && Array.isArray(assetsSymbols[1]);

    const fetchedAssetsSymbols: string[] = fetchSuccess ? uniq(assetsSymbols[0].concat(assetsSymbols[1])) : [];

    const exchangeSupportedAssets = fetchSuccess
      ? supportedAssets.filter(({ symbol, isSynthetixAsset }) =>
        isSynthetixAsset || fetchedAssetsSymbols.includes(symbol))
      : [];

    dispatch({
      type: SET_EXCHANGE_SUPPORTED_ASSETS,
      payload: exchangeSupportedAssets,
    });
    if (callback) callback();
    dispatch(saveDbAction('exchangeSupportedAssets', { exchangeSupportedAssets }, true));
  };
};
