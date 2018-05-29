// @flow
import ethers from 'ethers';
import { NavigationActions } from 'react-navigation';
import firebase from 'react-native-firebase';
import { delay } from 'utils/common';
import {
  ENCRYPTING,
  GENERATE_ENCRYPTED_WALLET,
  GENERATING,
  UPDATE_WALLET_STATE,
  API_REGISTRATION_STARTED,
  API_REGISTRATION_FAILED,
} from 'constants/walletConstants';
import { APP_FLOW, NEW_WALLET, ASSETS } from 'constants/navigationConstants';
import { SET_INITIAL_ASSETS } from 'constants/assetsConstants';
import { SET_RATES } from 'constants/ratesConstants';
import { PENDING, REGISTERED, SET_USER } from 'constants/userConstants';
import Storage from 'services/storage';
import { getExchangeRates } from 'services/assets';

const storage = Storage.getInstance('db');

export const registerWalletAction = () => {
  return async (dispatch: Function, getState: () => any, api: Object) => {
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

    const encryptedWallet = await wallet.encrypt(pin, { scrypt: { N: 8192 } })
      .then(JSON.parse)
      .catch(() => ({}));

    await storage.save('wallet', encryptedWallet);
    await storage.save('app_settings', { wallet: +new Date() });
    dispatch({
      type: GENERATE_ENCRYPTED_WALLET,
      payload: wallet,
    });
    // STEP 4: Initialize SDK annd register user
    await api.init(wallet.privateKey);
    await firebase.messaging().requestPermission();
    const fcmToken = await firebase.messaging().getToken();
    const user = await api.registerOnBackend(fcmToken);
    await storage.save('user', { user });
    const userState = Object.keys(user).length ? REGISTERED : PENDING;
    dispatch({
      type: SET_USER,
      payload: {
        user,
        state: userState,
      },
    });
    if (userState === PENDING) {
      await storage.save('assets', { assets: {} });
      dispatch({
        type: UPDATE_WALLET_STATE,
        payload: API_REGISTRATION_FAILED,
      });
      return;
    }

    // STEP 5: get&store initial assets
    const initialAssets = await api.getInitialAssets();
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

    // STEP 6: all done, navigate to the assets screen
    const navigateToAssetsAction = NavigationActions.navigate({
      routeName: APP_FLOW,
      params: {},
      action: NavigationActions.navigate({ routeName: ASSETS }),
    });

    dispatch(navigateToAssetsAction);
  };
};

export const registerOnBackendAction = () => {
  return async (dispatch: Function, getState: () => Object, api: Object) => {
    const { wallet: { data: wallet } } = getState();
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: API_REGISTRATION_STARTED,
    });
    await delay(1000);
    await api.init(wallet.privateKey);
    await firebase.messaging().requestPermission();
    const fcmToken = await firebase.messaging().getToken();
    const user = await api.registerOnBackend(fcmToken);
    await storage.save('user', { user });
    const userState = Object.keys(user).length ? REGISTERED : PENDING;
    dispatch({
      type: SET_USER,
      payload: {
        user,
        state: userState,
      },
    });

    if (userState === PENDING) {
      dispatch({
        type: UPDATE_WALLET_STATE,
        payload: API_REGISTRATION_FAILED,
      });
      return;
    }

    const navigateToAssetsAction = NavigationActions.navigate({
      routeName: APP_FLOW,
      params: {},
      action: NavigationActions.navigate({ routeName: ASSETS }),
    });

    dispatch(navigateToAssetsAction);
  };
};
