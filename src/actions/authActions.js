// @flow
import ethers from 'ethers';
import { NavigationActions } from 'react-navigation';
import DeviceInfo from 'react-native-device-info';
import {
  DECRYPT_WALLET,
  UPDATE_WALLET_STATE,
  DECRYPTING,
  INVALID_PASSWORD,
} from 'constants/walletConstants';
import { ASSETS, APP_FLOW } from 'constants/navigationConstants';
import { delay } from 'utils/common';
import Storage from 'services/storage';

const storage = Storage.getInstance('db');

export const loginAction = (pin: string) => {
  return async (dispatch: Function, getState: () => Object, api: Object) => {
    const encryptedWallet = await storage.get('wallet');
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: DECRYPTING,
    });
    await delay(100);
    const uniqueId = DeviceInfo.getUniqueID();
    const saltedPin = uniqueId + pin + uniqueId.slice(0, 5);
    try {
      const wallet = await ethers.Wallet.fromEncryptedWallet(JSON.stringify(encryptedWallet), saltedPin);
      await api.init(wallet.privateKey);
      dispatch({
        type: DECRYPT_WALLET,
        payload: wallet,
      });

      const navigateToAssetsAction = NavigationActions.navigate({
        routeName: APP_FLOW,
        params: {},
        action: NavigationActions.navigate({ routeName: ASSETS }),
      });

      dispatch(navigateToAssetsAction);
    } catch (e) {
      dispatch({
        type: UPDATE_WALLET_STATE,
        payload: INVALID_PASSWORD,
      });
    }
  };
};
