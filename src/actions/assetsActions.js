// @flow
import {
  UPDATE_ASSETS_STATE,
  UPDATE_ASSETS_BALANCES,
  FETCHING,
  ETH,
} from 'constants/assetsConstants';
import { transferETH, transferERC20, fetchETHBalance, fetchERC20Balance } from 'services/assets';
import type { TransactionPayload } from 'models/Transaction';
import type { Asset } from 'models/Asset';

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
  return async (dispatch: Function) => {
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

    Promise.all(promises)
      .then((data) => {
        dispatch({
          type: UPDATE_ASSETS_BALANCES,
          payload: data,
        });
      }).catch(console.log);
  };
};
