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
import { UPDATE_ASSETS } from 'constants/assetsConstants';
import Storage from 'services/storage';
import { initialAssets } from 'fixtures/assets';

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
      .catch(() => {});

    await storage.save('wallet', encryptedWallet);
    await storage.save('app_settings', { wallet: +new Date() });
    dispatch({
      type: GENERATE_ENCRYPTED_WALLET,
      payload: wallet,
    });

    // STEP 4: store initial assets
    // TODO: get the initial assets from SDK
    const convertedAssets = initialAssets.reduce((memo, asset) => {
      memo[asset.symbol] = asset;
      return memo;
    }, {});

    dispatch({
      type: UPDATE_ASSETS,
      payload: convertedAssets,
    });
    await storage.save('assets', { assets: convertedAssets });

    // STEP 5: all done, navigate to the assets screen
    dispatch(NavigationActions.navigate({ routeName: ASSETS }));
  };
};
