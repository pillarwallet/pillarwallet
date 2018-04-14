// @flow
import { utils } from 'ethers';
import {
  UPDATE_ASSET,
  UPDATE_ASSETS_STATE,
  FETCHING,
  FETCHED
} from 'constants/assetsConstants';
import { delay } from 'utils/delay';

export const sendAssetAction = ({ gasLimit, amount, address, gasPrice }: { gasLimit: number, amount: number, address: string}) => {
  return async (dispatch: Function, getState: Function) => {
    const { wallet: { data: wallet }, assets: { data: assets } } = getState();
    const trx = {
      gasLimit,
      gasPrice: utils.bigNumberify(gasPrice),
      value: utils.parseEther(amount.toString()),
      to: address
    }
    dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHING
    });
    const hash = await wallet.sendTransaction(trx)
    dispatch({
      type: UPDATE_ASSET,
      payload: { id: 'ETH', balance: assets['ETH'].balance - amount },
    });
    dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHED
    });
  };
};

// temporary here to fetch JUST Ether balance
export const fetchEtherBalanceAction = () => {
  return async (dispatch: Function, getState: Function) => {
    dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHING
    });
    // wallet is not neccessary
    const { wallet: { data: wallet } } = getState();
    const balance = await wallet.getBalance().then(utils.formatEther);
    dispatch({
      type: UPDATE_ASSET,
      payload: { id: 'ETH', balance }
    });
    dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHED
    });
  };
}

export default {
  sendAssetAction,
  fetchEtherBalanceAction,
};

