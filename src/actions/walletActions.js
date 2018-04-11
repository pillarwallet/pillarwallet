// @flow
import ethers from 'ethers';
import {
  GENERATE_ENCRYPTED_WALLET,
  CREATED,
  ENCRYPTING,
  GENERATING,
  UPDATE_WALLET_STATE,
} from '../constants/walletConstants';
import { delay } from '../utils/delay';

export const generateEncryptedWalletAction = (mnemonic: string, pin: string) => {
  return async (dispatch: Function) => {
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: GENERATING,
    });
    await delay(100);

    const wallet = ethers.Wallet.fromMnemonic(mnemonic);
    dispatch({
      type: UPDATE_WALLET_STATE,
      payload: ENCRYPTING,
    });
    await delay(100);

    const encryptedWallet = await wallet.encrypt(pin, { scrypt: { N: 16384 } })
      .then(JSON.parse)
      .catch(() => null);
    dispatch({
      type: GENERATE_ENCRYPTED_WALLET,
      payload: { data: { ...encryptedWallet }, walletState: CREATED },
    });
  };
};

