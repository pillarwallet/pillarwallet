// @flow
import ethers from 'ethers';
import { NavigationActions } from 'react-navigation';
import { delay } from 'utils/common';
import {
  ENCRYPTING,
  GENERATE_ENCRYPTED_WALLET,
  GENERATING,
  UPDATE_WALLET_STATE,
} from 'constants/walletConstants';
import { ASSETS, NEW_WALLET } from 'constants/navigationConstants';
import Storage from 'services/storage';

const storage = Storage.getInstance('db');

export const registerWalletAction = () => {
  return async (dispatch: Function, getState: () => any) => {
    const currentState = getState();
    const { mnemonic, pin, importedWallet } = currentState.wallet.onboarding;
    const mnemonicPhrase = mnemonic.original;

    dispatch(NavigationActions.navigate({ routeName: NEW_WALLET }));
    await delay(50);

    let wallet = importedWallet;
    if (!wallet) {
      dispatch({
        type: UPDATE_WALLET_STATE,
        payload: GENERATING,
      });
      await delay(50);
      wallet = ethers.Wallet.fromMnemonic(mnemonicPhrase);
    }

    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: ENCRYPTING,
    });
    await delay(50);

    const encryptedWallet = await wallet.encrypt(pin, { scrypt: { N: 16384 } })
      .then(JSON.parse)
      .catch(() => {});

    await storage.save('wallet', encryptedWallet);
    await storage.save('app_settings', { wallet: +new Date() });
    dispatch({
      type: GENERATE_ENCRYPTED_WALLET,
      payload: wallet,
    });
    dispatch(NavigationActions.navigate({ routeName: ASSETS }));
  };
};
