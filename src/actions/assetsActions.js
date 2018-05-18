// @flow
import merge from 'lodash.merge';
import {
  UPDATE_ASSETS_STATE,
  UPDATE_ASSETS,
  ADD_ASSET,
  REMOVE_ASSET,
  FETCHING,
  ETH,
} from 'constants/assetsConstants';
import { SET_RATES } from 'constants/ratesConstants';
import { transferETH, transferERC20, fetchETHBalance, fetchERC20Balance, getExchangeRates } from 'services/assets';
import { transformAssetsToObject } from 'utils/assets';
import type { TransactionPayload } from 'models/Transaction';
import type { Asset } from 'models/Asset';
import Storage from 'services/storage';

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

export const fetchAssetsBalancesAction = (assets: Object, walletAddress: string) => {
  return async (dispatch: Function, getState: Function) => {
    dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHING,
    });

    // extract once API provided.
    const promises = Object.keys(assets).map(key => assets[key]).map(async (asset: Asset) => {
      const balance = asset.symbol === ETH
        ? await fetchETHBalance(walletAddress)
        : await fetchERC20Balance(walletAddress, asset.address);
      return {
        balance,
        symbol: asset.symbol,
      };
    });

    // once API provided from SDK, there won't be need to merge
    const balances = await Promise.all(promises);
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

export const addAssetAction = (asset: Object) => ({
  type: ADD_ASSET,
  payload: asset
});

export const removeAssetAction = (asset: Object) => ({
  type: REMOVE_ASSET,
  payload: asset
});
