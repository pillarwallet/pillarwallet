// @flow
import ethers from 'ethers';
import { NavigationActions } from 'react-navigation';
import { delay } from 'utils/common';
import {
  ENCRYPTING,
  GENERATE_ENCRYPTED_WALLET,
  GENERATING,
  UPDATE_WALLET_STATE,
  API_REGISTRATION_FAILED,
} from 'constants/walletConstants';
import { ASSETS, NEW_WALLET } from 'constants/navigationConstants';
import { SET_INITIAL_ASSETS } from 'constants/assetsConstants';
import { SET_RATES } from 'constants/ratesConstants';
import Storage from 'services/storage';
import { getExchangeRates } from 'services/assets';
import { registerOnBackend, getInitialAssets } from 'services/api';

const storage = Storage.getInstance('db');

export const registerWalletAction = () => {
  return async (dispatch: Function, getState: () => any) => {
    const currentState = getState();
    const { mnemonic, pin, importedWallet } = currentState.wallet.onboarding;
    const mnemonicPhrase = mnemonic.original;

    // STEP 1: navigate to the new wallet screen
    dispatch(NavigationActions.navigate({ routeName: NEW_WALLET }));
    await delay(50);

    // STEP 2: check if wallet was imported or create it from the mnemonic phrase otherwise
    let wallet = importedWallet;
    if (!wallet) {
      dispatch({
        type: UPDATE_WALLET_STATE,
        payload: GENERATING,
      });
      await delay(50);
      wallet = ethers.Wallet.fromMnemonic(mnemonicPhrase);
    }

    // STEP 3: encrypt the wallet
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: ENCRYPTING,
    });
    await delay(50);

    const encryptedWallet = await wallet.encrypt(pin, { scrypt: { N: 16384 } })
      .then(JSON.parse)
      .catch(() => ({}));

    await storage.save('wallet', encryptedWallet);
    await storage.save('app_settings', { wallet: +new Date() });
    dispatch({
      type: GENERATE_ENCRYPTED_WALLET,
      payload: wallet,
    });

    const user = await registerOnBackend(wallet.privateKey);
    await storage.save('user', { user });

    if (!user) {
      await storage.save('assets', { assets: {} });
      dispatch({
        type: UPDATE_WALLET_STATE,
        payload: API_REGISTRATION_FAILED,
      });
      return;
    }

    // STEP 4: get&store initial assets
    const initialAssets = await getInitialAssets();
    const rates = await getExchangeRates(Object.keys(initialAssets));

    dispatch({
      type: SET_RATES,
      payload: rates,
    });

    dispatch({
      type: SET_INITIAL_ASSETS,
      payload: initialAssets,
    });

    await storage.save('assets', { assets: initialAssets });

    // STEP 5: all done, navigate to the assets screen
    dispatch(NavigationActions.navigate({ routeName: ASSETS }));
  };
};
