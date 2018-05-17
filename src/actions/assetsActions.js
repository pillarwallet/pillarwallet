// @flow
import {
  UPDATE_ASSETS_STATE,
  UPDATE_ASSETS_BALANCES,
  SET_INITIAL_ASSETS,
  FETCHING,
  FETCHING_INITIAL,
  FETCH_INITIAL_FAILED,
  FETCHED_INITIAL,
  ETH,
} from 'constants/assetsConstants';
import { SET_RATES } from 'constants/ratesConstants';
import {
  transferETH,
  transferERC20,
  fetchETHBalance,
  fetchERC20Balance,
  getExchangeRates,
} from 'services/assets';
import type { TransactionPayload } from 'models/Transaction';
import type { Assets, Asset } from 'models/Asset';
import { getInitialAssets } from 'services/api';
import Storage from 'services/storage';
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
  return async (dispatch: Function) => {
    dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHING,
    });

    // extract once API provided.
    const promises = Object.keys(assets)
      .map(key => assets[key])
      .map(async (asset: Asset) => {
        const balance = asset.symbol === ETH
          ? await fetchETHBalance(walletAddress)
          : await fetchERC20Balance(walletAddress, asset.address);
        return {
          balance,
          symbol: asset.symbol,
        };
      });

    Promise.all(promises)
      .then((data) => {
        dispatch({
          type: UPDATE_ASSETS_BALANCES,
          payload: data,
        });
      }).catch(console.log); // eslint-disable-line
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

export const fetchInitialAssetsAction = () => {
  return async (dispatch: Function) => {
    dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHING_INITIAL,
    });
    await delay(1000);
    const initialAssets = await getInitialAssets();

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

    await storage.save('assets', { assets: initialAssets });
  };
};
