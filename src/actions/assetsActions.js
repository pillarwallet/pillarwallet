// @flow
import merge from 'lodash.merge';
import { Sentry } from 'react-native-sentry';
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
  UPDATE_BALANCES,
} from 'constants/assetsConstants';
import { ADD_TRANSACTION } from 'constants/historyConstants';
import { UPDATE_RATES } from 'constants/ratesConstants';
import {
  transferETH,
  transferERC20,
  getExchangeRates,
} from 'services/assets';
import type { TransactionPayload } from 'models/Transaction';
import type { Assets } from 'models/Asset';
import Storage from 'services/storage';
import { transformAssetsToObject } from 'utils/assets';
import { delay, noop, uniqBy } from 'utils/common';
import { buildHistoryTransaction } from 'utils/history';

const storage = Storage.getInstance('db');

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
}: TransactionPayload, navigateToNextScreen: Function = noop) => {
  return async (dispatch: Function, getState: Function) => {
    const {
      wallet: { data: wallet },
      history: { data: currentHistory },
    } = getState();
    let txStatus: TransactionStatus;
    if (symbol === ETH) {
      const ETHTrx = await transferETH({
        gasLimit,
        gasPrice,
        to,
        amount,
        wallet,
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
        const historyTx = buildHistoryTransaction({ ...ETHTrx, asset: symbol });
        dispatch({
          type: ADD_TRANSACTION,
          payload: historyTx,
        });
        const updatedHistory = uniqBy([historyTx, ...currentHistory], 'hash');
        storage.save('history', { history: updatedHistory }, true);
      }
      txStatus = ETHTrx.hash
        ? { isSuccess: true, error: null }
        : { isSuccess: false, error: ETHTrx.error };
      navigateToNextScreen(txStatus);
      return;
    }

    const ERC20Trx = await transferERC20({
      to,
      amount,
      contractAddress,
      wallet,
      decimals,
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
      });
      dispatch({
        type: ADD_TRANSACTION,
        payload: historyTx,
      });
      const updatedHistory = uniqBy([historyTx, ...currentHistory], 'hash');
      storage.save('history', { history: updatedHistory }, true);
    }
    txStatus = ERC20Trx.hash
      ? { isSuccess: true, error: null }
      : { isSuccess: false, error: ERC20Trx.error };
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
    storage.save('assets', { assets: updatedAssets }, true);
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
    const transformedBalances = transformAssetsToObject(balances);
    await storage.save('balances', { balances: transformedBalances }, true);
    dispatch({ type: UPDATE_BALANCES, payload: transformedBalances });

    // @TODO: Extra "rates fetching" to it's own action ones required.
    const rates = await getExchangeRates(Object.keys(assets));
    await storage.save('rates', { rates }, true);
    dispatch({ type: UPDATE_RATES, payload: rates });
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
