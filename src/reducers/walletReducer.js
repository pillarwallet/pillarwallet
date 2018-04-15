// @flow
import {
  GENERATE_ENCRYPTED_WALLET,
  UPDATE_WALLET_STATE,
  DECRYPT_WALLET,
  CREATED,
  DECRYPTED,
  SET_WALLET_ERROR,
  WALLET_ERROR,
  IMPORT_SET_PIN,
} from 'constants/walletConstants';

export type Wallet = {
  address: string,
  privateKey: string
}

export type WalletReducerState = {
  data: Wallet,
  walletState: ?string,
  error: ?{
    code: string,
    message: string,
  },
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
  error: null,
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
    case SET_WALLET_ERROR:
      return { ...state, error: action.payload, walletState: WALLET_ERROR };
    case DECRYPT_WALLET:
      return { ...state, data: action.payload, walletState: DECRYPTED };
    case IMPORT_SET_PIN:
      return { ...state, data: action.payload, walletState: IMPORT_SET_PIN };
    default:
      return state;
  }
}
