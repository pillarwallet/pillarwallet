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
import merge from 'lodash.merge';
import { Sentry } from 'react-native-sentry';
import { providers } from 'ethers';
import { NETWORK_PROVIDER } from 'react-native-dotenv';
import {
  UPDATE_ASSETS_STATE,
  UPDATE_ASSETS,
  START_ASSETS_SEARCH,
  UPDATE_ASSETS_SEARCH_RESULT,
  RESET_ASSETS_SEARCH_RESULT,
  REMOVE_ASSET,
  SET_INITIAL_ASSETS,
  FETCHING,
  FETCHING_INITIAL,
  FETCH_INITIAL_FAILED,
  ETH,
  UPDATE_BALANCES,
  UPDATE_SUPPORTED_ASSETS,
} from 'constants/assetsConstants';
import { UPDATE_TX_COUNT } from 'constants/txCountConstants';
import { ADD_TRANSACTION } from 'constants/historyConstants';
import { UPDATE_RATES } from 'constants/ratesConstants';
import {
  transferETH,
  transferERC20,
  getExchangeRates,
} from 'services/assets';
import type { TransactionPayload } from 'models/Transaction';
import type { Asset, Assets } from 'models/Asset';
import { transformAssetsToObject } from 'utils/assets';
import { delay, noop, uniqBy } from 'utils/common';
import { buildHistoryTransaction } from 'utils/history';
import { saveDbAction } from './dbActions';

type TransactionStatus = {
  isSuccess: boolean,
  error: ?string,
};

export const sendAssetAction = ({
  gasLimit,
  amount,
  to,
  gasPrice,
  symbol,
  contractAddress,
  decimals,
  note,
}: TransactionPayload, wallet: Object, navigateToNextScreen: Function = noop) => {
  return async (dispatch: Function, getState: Function) => {
    const { history: { data: currentHistory }, txCount: { data: { lastNonce } } } = getState();
    let txStatus: TransactionStatus;

    wallet.provider = providers.getDefaultProvider(NETWORK_PROVIDER);
    const transactionCount = await wallet.provider.getTransactionCount(wallet.address, 'pending');

    let nonce;

    if (lastNonce === transactionCount && lastNonce > 0) {
      nonce = lastNonce + 1;
    }

    if (symbol === ETH) {
      const ETHTrx = await transferETH({
        gasLimit,
        gasPrice,
        to,
        amount,
        wallet,
        nonce,
      }).catch((e) => {
        Sentry.captureException({
          tx: {
            gasLimit,
            gasPrice,
            to,
            amount,
          },
          type: 'ETH',
          error: e.message,
        });
        return { error: e.message };
      });
      if (ETHTrx.hash) {
        const historyTx = buildHistoryTransaction({ ...ETHTrx, asset: symbol, note });
        dispatch({
          type: ADD_TRANSACTION,
          payload: historyTx,
        });
        const updatedHistory = uniqBy([historyTx, ...currentHistory], 'hash');
        dispatch(saveDbAction('history', { history: updatedHistory }, true));

        const txCountNew = { lastCount: transactionCount, lastNonce: ETHTrx.nonce };
        dispatch({
          type: UPDATE_TX_COUNT,
          payload: txCountNew,
        });
        dispatch(saveDbAction('txCount', { txCount: txCountNew }, true));
      }
      txStatus = ETHTrx.hash
        ? {
          isSuccess: true, error: null, note, to, txHash: ETHTrx.hash,
        }
        : {
          isSuccess: false, error: ETHTrx.error, note, to,
        };
      navigateToNextScreen(txStatus);
      return;
    }

    const ERC20Trx = await transferERC20({
      to,
      amount,
      contractAddress,
      wallet,
      decimals,
      nonce,
    }).catch((e) => {
      Sentry.captureException({
        tx: {
          decimals,
          contractAddress,
          to,
          amount,
        },
        type: 'ERC20',
        error: e.message,
      });
      return { error: e.message };
    });
    if (ERC20Trx.hash) {
      const historyTx = buildHistoryTransaction({
        ...ERC20Trx,
        asset: symbol,
        value: amount * (10 ** decimals),
        to, // HACK: in the real ERC20Trx object the 'To' field contains smart contract address
        note,
      });
      dispatch({
        type: ADD_TRANSACTION,
        payload: historyTx,
      });
      const updatedHistory = uniqBy([historyTx, ...currentHistory], 'hash');
      dispatch(saveDbAction('history', { history: updatedHistory }, true));

      const txCountNew = { lastCount: transactionCount, lastNonce: ERC20Trx.nonce };
      dispatch({
        type: UPDATE_TX_COUNT,
        payload: txCountNew,
      });
      dispatch(saveDbAction('txCount', { txCount: txCountNew }, true));
    }
    txStatus = ERC20Trx.hash
      ? {
        isSuccess: true, error: null, note, to, txHash: ERC20Trx.hash,
      }
      : {
        isSuccess: false, error: ERC20Trx.error, note, to,
      };
    navigateToNextScreen(txStatus);
  };
};

export const updateAssetsAction = (assets: Assets, assetsToExclude?: string[] = []) => {
  return (dispatch: Function) => {
    const updatedAssets = Object.keys(assets)
      .map(key => assets[key])
      .reduce((memo, item) => {
        if (!assetsToExclude.includes(item.symbol)) {
          memo[item.symbol] = item;
        }
        return memo;
      }, {});
    dispatch(saveDbAction('assets', { assets: updatedAssets }, true));
    dispatch({
      type: UPDATE_ASSETS,
      payload: updatedAssets,
    });
  };
};

export const fetchAssetsBalancesAction = (assets: Assets, walletAddress: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHING,
    });

    const balances = await api.fetchBalances({ address: walletAddress, assets: Object.values(assets) });
    if (balances && balances.length) {
      const transformedBalances = transformAssetsToObject(balances);
      dispatch(saveDbAction('balances', { balances: transformedBalances }, true));
      dispatch({ type: UPDATE_BALANCES, payload: transformedBalances });
    }

    // @TODO: Extra "rates fetching" to it's own action ones required.
    const rates = await getExchangeRates(Object.keys(assets));
    if (rates && Object.keys(rates).length) {
      dispatch(saveDbAction('rates', { rates }, true));
      dispatch({ type: UPDATE_RATES, payload: rates });
    }
  };
};

export const fetchInitialAssetsAction = (walletAddress: string) => {
  return async (dispatch: Function, getState: () => Object, api: Object) => {
    const { user: { data: { walletId } } } = getState();
    dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHING_INITIAL,
    });
    await delay(1000);
    const initialAssets = await api.fetchInitialAssets(walletId);

    if (!Object.keys(initialAssets).length) {
      dispatch({
        type: UPDATE_ASSETS_STATE,
        payload: FETCH_INITIAL_FAILED,
      });
      return;
    }

    dispatch({
      type: SET_INITIAL_ASSETS,
      payload: initialAssets,
    });

    const rates = await getExchangeRates(Object.keys(initialAssets));
    dispatch({
      type: UPDATE_RATES,
      payload: rates,
    });

    const balances = await api.fetchBalances({ address: walletAddress, assets: Object.values(initialAssets) });
    const updatedAssets = merge({}, initialAssets, transformAssetsToObject(balances));
    dispatch(saveDbAction('assets', { assets: updatedAssets }));
    dispatch({
      type: UPDATE_ASSETS,
      payload: updatedAssets,
    });
  };
};

export const addAssetAction = (asset: Asset) => {
  return async (dispatch: Function, getState: () => Object) => {
    const {
      assets: { data: assets },
      wallet: { data: wallet },
    } = getState();
    const updatedAssets = { ...assets, [asset.symbol]: { ...asset } };
    dispatch(saveDbAction('assets', { assets: updatedAssets }));
    dispatch({
      type: UPDATE_ASSETS,
      payload: updatedAssets,
    });
    dispatch(fetchAssetsBalancesAction(assets, wallet.address));
  };
};

export const removeAssetAction = (asset: Object) => ({
  type: REMOVE_ASSET,
  payload: asset,
});

export const startAssetsSearchAction = () => ({
  type: START_ASSETS_SEARCH,
});

export const searchAssetsAction = (query: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { user: { data: { walletId } } } = getState();

    const assets = await api.assetsSearch(query, walletId);

    dispatch({
      type: UPDATE_ASSETS_SEARCH_RESULT,
      payload: assets,
    });
  };
};

export const resetSearchAssetsResultAction = () => ({
  type: RESET_ASSETS_SEARCH_RESULT,
});

export const checkForMissedAssetsAction = (transactionNotifications: Object[]) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId } },
      assets: { data: currentAssets, supportedAssets },
      wallet: { data: wallet },
    } = getState();

    // load supported assets
    let walletSupportedAssets = [...supportedAssets];
    if (!supportedAssets.length) {
      walletSupportedAssets = await api.fetchSupportedAssets(walletId);
      dispatch({
        type: UPDATE_SUPPORTED_ASSETS,
        payload: walletSupportedAssets,
      });
      const currentAssetsTickers = Object.keys(currentAssets);

      // HACK: Dirty fix for users who removed somehow Eth from their assets list
      if (!currentAssetsTickers.includes(ETH)) currentAssetsTickers.push(ETH);

      if (walletSupportedAssets.length) {
        const updatedAssets = walletSupportedAssets
          .filter(asset => currentAssetsTickers.includes(asset.symbol))
          .reduce((memo, asset) => ({ ...memo, [asset.symbol]: asset }), {});
        dispatch({
          type: UPDATE_ASSETS,
          payload: updatedAssets,
        });
        dispatch(saveDbAction('assets', { assets: updatedAssets }, true));
      }
    }

    // check if some assets are not enabled
    const myAddress = wallet.address.toUpperCase();
    const missedAssets = transactionNotifications
      .filter(tx => tx.from.toUpperCase() !== myAddress)
      .reduce((memo, { asset: ticker }) => {
        if (!ticker) return memo;
        if (memo[ticker] !== undefined || currentAssets[ticker] !== undefined) return memo;

        const supportedAsset = walletSupportedAssets.find(asset => asset.symbol === ticker);
        if (supportedAsset) {
          memo[ticker] = supportedAsset;
        }
        return memo;
      }, {});

    if (Object.keys(missedAssets).length) {
      const newAssets = { ...currentAssets, ...missedAssets };
      dispatch(updateAssetsAction(newAssets));
      dispatch(fetchAssetsBalancesAction(newAssets, wallet.address));
    }
  };
};
