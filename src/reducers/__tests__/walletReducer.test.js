// @flow
import {
  GENERATE_ENCRYPTED_WALLET,
  UPDATE_WALLET_STATE,
  DECRYPT_WALLET,
  CREATED,
  DECRYPTED,
  GENERATING,
} from 'constants/walletConstants';
import reducer from '../walletReducer';

const mockWallet: Object = {
  address: '0x',
  privateKey: '',
};
const mockOnboarding: Object = {
  confirmedPin: '',
  importedWallet: null,
  mnemonic: { original: '', shuffled: '', wordsToValidate: [] },
  pin: '',
};

describe('Wallet reducer', () => {
  it('should handle GENERATE_ENCRYPTED_WALLET', () => {
    const updateAction = { type: GENERATE_ENCRYPTED_WALLET, payload: mockWallet };
    const expected = {
      data: mockWallet,
      error: null,
      onboarding: mockOnboarding,
      walletState: CREATED,
    };
    expect(reducer(undefined, updateAction)).toEqual(expected);
  });

  it('should handle UPDATE_WALLET_STATE', () => {
    const updateAction = { type: UPDATE_WALLET_STATE, payload: GENERATING };
    expect(reducer(undefined, updateAction)).toMatchObject({ walletState: GENERATING });
  });

  it('should handle DECRYPT_WALLET', () => {
    const updateAction = { type: DECRYPT_WALLET, payload: mockWallet };
    const expected = {
      data: mockWallet,
      error: null,
      onboarding: mockOnboarding,
      walletState: DECRYPTED,
    };
    expect(reducer(undefined, updateAction)).toEqual(expected);
  });
});
