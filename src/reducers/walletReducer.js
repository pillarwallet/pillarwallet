// @flow
import merge from 'lodash.merge';
import {
  GENERATE_ENCRYPTED_WALLET,
  UPDATE_WALLET_STATE,
  DECRYPT_WALLET,
  CREATED,
  DECRYPTED,
  SET_WALLET_ERROR,
  WALLET_ERROR,
  IMPORT_WALLET,
  UPDATE_WALLET_MNEMONIC,
  NEW_WALLET_SET_PIN,
  NEW_WALLET_CONFIRM_PIN,
  PIN_SET,
  PIN_CONFIRMED,
  SET_API_USER,
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
  payload: any
}

const initialState = {
  data: {
    address: '',
    privateKey: '',
  },
  onboarding: {
    mnemonic: {
      original: '',
      shuffled: '',
      wordsToValidate: [],
    },
    pin: '',
    confirmedPin: '',
    importedWallet: null,
    apiUser: {},
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
      return merge({}, state, { data: action.payload, walletState: CREATED });
    case UPDATE_WALLET_STATE:
      return merge({}, state, { walletState: action.payload });
    case UPDATE_WALLET_MNEMONIC:
      return merge({}, state, { onboarding: { mnemonic: action.payload } });
    case SET_WALLET_ERROR:
      return merge({}, state, { error: action.payload, walletState: WALLET_ERROR });
    case DECRYPT_WALLET:
      return merge({}, state, { data: action.payload, walletState: DECRYPTED });
    case NEW_WALLET_SET_PIN:
      return merge(
        {},
        state,
        { onboarding: { pin: action.payload, confirmedPin: '' }, walletState: PIN_SET },
      );
    case NEW_WALLET_CONFIRM_PIN:
      return merge(
        {},
        state, { onboarding: { confirmedPin: action.payload }, walletState: PIN_CONFIRMED },
      );
    case IMPORT_WALLET:
      const { importedWallet, apiUser } = action.payload;
      return merge({}, state, { onboarding: { importedWallet, apiUser } });
    case SET_API_USER:
      return merge({}, state, { onboarding: { apiUser: action.payload } });
    default:
      return state;
  }
}
