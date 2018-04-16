// @flow
import { utils, providers } from 'ethers';
import {
  UPDATE_ASSET,
  UPDATE_ASSETS_STATE,
  FETCHING,
  FETCHED,
  ETH,
} from 'constants/assetsConstants';

// Consider adding asset ID?
type Transaction = {
  gasLimit: number,
  amount: number,
  address: string,
  gasPrice: number
}

export const sendAssetAction = ({
  gasLimit,
  amount,
  address,
  gasPrice,
}: Transaction) => {
  return async (dispatch: Function, getState: Function) => {
    const { wallet: { data: wallet }, assets: { data: assets } } = getState();
    wallet.providers = providers.getDefaultProvider('ropsten');
    const trx = {
      gasLimit,
      gasPrice: utils.bigNumberify(gasPrice),
      value: utils.parseEther(amount.toString()),
      to: address,
    };
    dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHING,
    });

    await wallet.sendTransaction(trx);

    // worth consdering moving calculation logic to reducer
    dispatch({
      type: UPDATE_ASSET,
      payload: { id: ETH, balance: assets[ETH].balance - amount }, // Temporary here
    });
    dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHED,
    });
  };
};

// temporary here to fetch JUST Ether balance
export const fetchEtherBalanceAction = () => {
  return async (dispatch: Function, getState: Function) => {
    dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHING,
    });
    // whole wallet is not neccessary.
    const { wallet: { data: wallet } } = getState();
    const provider = providers.getDefaultProvider('ropsten'); // MOVE TO .ENV ONCE DESIGNED AND IMPLEMETNED
    const balance = await provider.getBalance(wallet.address).then(utils.formatEther);
    dispatch({
      type: UPDATE_ASSET,
      payload: { id: ETH, balance },
    });
    dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHED,
    });
  };
};

export default {
  sendAssetAction,
  fetchEtherBalanceAction,
};

