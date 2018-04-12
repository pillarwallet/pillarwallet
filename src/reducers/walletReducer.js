// @flow
import {
  GENERATE_ENCRYPTED_WALLET,
  UPDATE_WALLET_STATE,
  DECRYPT_WALLET,
  CREATED,
  DECRYPTED,
} from '../constants/walletConstants';

export type Wallet = {
  address: string,
  privateKey: string
}

export type WalletReducerState = {
  data: Wallet,
  walletState: ?boolean
}

export type WalletReducerAction = {
  type: string,
  payload: Object
}

const initialState = {
  data: {
    address: '',
    privateKey: '',
  },
  walletState: null,
};

export default function newWalletReducer(
  state: WalletReducerState = initialState,
  action: WalletReducerAction,
) {
  switch (action.type) {
    case GENERATE_ENCRYPTED_WALLET:
      return { ...state, data: action.payload, walletState: CREATED };
    case UPDATE_WALLET_STATE:
      return { ...state, walletState: action.payload };
    case DECRYPT_WALLET:
      return { ...state, data: action.payload, walletState: DECRYPTED };
    default:
      return state;
  }
}
