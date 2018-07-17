// @flow
import merge from 'lodash.merge';
import {
  UPDATE_ASSETS_STATE,
  UPDATE_ASSETS,
  UPDATE_SUPPORTED_ASSETS,
  ADD_ASSET,
  REMOVE_ASSET,
  SET_INITIAL_ASSETS,
  FETCHING,
  FETCHING_INITIAL,
  FETCH_INITIAL_FAILED,
  ETH,
} from 'constants/assetsConstants';
import { ADD_TRANSACTION } from 'constants/historyConstants';
import { SET_RATES } from 'constants/ratesConstants';
import {
  transferETH,
  transferERC20,
  getExchangeRates,
} from 'services/assets';
import type { TransactionPayload } from 'models/Transaction';
import type { Assets } from 'models/Asset';
import Storage from 'services/storage';
import { transformAssetsToObject } from 'utils/assets';
import { delay } from 'utils/common';
import { buildHistoryTransaction } from 'utils/history';

const storage = Storage.getInstance('db');

export const sendAssetAction = ({
  gasLimit,
  amount,
  to,
  gasPrice,
  symbol,
  contractAddress,
}: TransactionPayload) => {
  return async (dispatch: Function, getState: Function) => {
    const { wallet: { data: wallet } } = getState();
    if (symbol === ETH) {
      const ETHTrx = await transferETH({
        gasLimit,
        gasPrice,
        to,
        amount,
        wallet,
      });
      dispatch({
        type: ADD_TRANSACTION,
        payload: buildHistoryTransaction({ ...ETHTrx, asset: symbol }),
      });
      return;
    }

    const ERC20Trx = await transferERC20({
      to,
      amount,
      contractAddress,
      wallet,
    });
    dispatch({
      type: ADD_TRANSACTION,
      payload: buildHistoryTransaction({ ...ERC20Trx, asset: symbol }),
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
    const updatedAssets = merge({}, assets, transformAssetsToObject(balances));
    const rates = await getExchangeRates(Object.keys(updatedAssets));
    await storage.save('assets', { assets: updatedAssets });
    dispatch({ type: SET_RATES, payload: rates });
    dispatch({
      type: UPDATE_ASSETS,
      payload: updatedAssets,
    });
  };
};

export const fetchSupportedAssetsAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { user: { data: { walletId } } } = getState();
    const assets = await api.fetchSupportedAssets(walletId);
    dispatch({
      type: UPDATE_SUPPORTED_ASSETS,
      payload: assets,
    });
  };
};

export const fetchExchangeRatesAction = (assets: Assets) => {
  return async (dispatch: Function) => {
    const tickers = Object.keys(assets);
    if (tickers.length) {
      getExchangeRates(tickers)
        .then(rates => dispatch({ type: SET_RATES, payload: rates }))
        .catch(console.log); // eslint-disable-line
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
      type: SET_RATES,
      payload: rates,
    });

    const balances = await api.fetchBalances({ address: walletAddress, assets: Object.values(initialAssets) });
    const updatedAssets = merge({}, initialAssets, transformAssetsToObject(balances));
    await storage.save('assets', { assets: updatedAssets });
    dispatch({
      type: UPDATE_ASSETS,
      payload: updatedAssets,
    });
  };
};

export const addAssetAction = (asset: Object) => ({
  type: ADD_ASSET,
  payload: asset,
});

export const removeAssetAction = (asset: Object) => ({
  type: REMOVE_ASSET,
  payload: asset,
});
