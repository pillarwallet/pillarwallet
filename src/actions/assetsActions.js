// @flow
import { utils, providers } from 'ethers';
import {
  UPDATE_ASSET,
  UPDATE_ASSETS_STATE,
  FETCHING,
  FETCHED,
  ETH,
} from 'constants/assetsConstants';
import { PROVIDER } from 'react-native-dotenv';
import type { TransactionPayload } from 'models/Transaction';

export const sendAssetAction = ({
  gasLimit,
  amount,
  address,
  gasPrice,
}: TransactionPayload) => {
  return async (dispatch: Function, getState: Function) => {
    const { wallet: { data: wallet }, assets: { data: assets } } = getState();
    wallet.provider = providers.getDefaultProvider(PROVIDER);
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
    const provider = providers.getDefaultProvider(PROVIDER);
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
