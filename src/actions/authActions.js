// @flow
import ethers from 'ethers';
import { NavigationActions } from 'react-navigation';
import {
  DECRYPT_WALLET,
  UPDATE_WALLET_STATE,
  DECRYPTING,
  INVALID_PASSWORD,
} from 'constants/walletConstants';
import { ASSETS } from 'constants/navigationConstants';
import { SET_RATES } from 'constants/ratesConstants';
import { delay } from 'utils/common';
import Storage from 'services/storage';
import { getExchangeRates } from 'utils/assets';

const storage = Storage.getInstance('db');

export const loginAction = (pin: string) => {
  return async (dispatch: Function, getState: () => any) => {
    const currentState = getState();
    const { data: assets } = currentState.assets;
    const encryptedWallet = await storage.get('wallet');
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: DECRYPTING,
    });
    await delay(100);

    try {
      const wallet = await ethers.Wallet.fromEncryptedWallet(JSON.stringify(encryptedWallet), pin);
      dispatch({
        type: DECRYPT_WALLET,
        payload: wallet,
      });

      // Load exchange rates
      const tickers = Object.keys(assets);
      if (tickers.length) {
        getExchangeRates(tickers)
          .then(rates => dispatch({ type: SET_RATES, payload: rates }))
          .catch(console.log); // eslint-disable-line
      }
      dispatch(NavigationActions.navigate({ routeName: ASSETS }));
    } catch (e) {
      dispatch({
        type: UPDATE_WALLET_STATE,
        payload: INVALID_PASSWORD,
      });
    }
  };
};
