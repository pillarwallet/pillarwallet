// @flow
import merge from 'lodash.merge';
import {
  UPDATE_ASSETS_STATE,
  UPDATE_ASSETS,
  ADD_ASSET,
  REMOVE_ASSET,
  SET_INITIAL_ASSETS,
  FETCHING,
  FETCHING_INITIAL,
  FETCH_INITIAL_FAILED,
  ETH,
} from 'constants/assetsConstants';
import { SET_HISTORY } from 'constants/historyConstants';
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
      transferETH({
        gasLimit,
        gasPrice,
        to,
        amount,
        wallet,
      });
      return;
    }
    transferERC20({
      to,
      amount,
      contractAddress,
      wallet,
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

export const fetchTransactionsHistoryAction = (walletAddress: string, asset: string = 'ALL') => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const history = await api.fetchHistory({ address1: walletAddress, asset });
    dispatch({
      type: SET_HISTORY,
      payload: {
        transactions: history,
        asset,
      },
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
    const initialAssets = await api.getInitialAssets(walletId);

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
