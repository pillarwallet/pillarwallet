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
};

describe('Wallet reducer', () => {
  it('should handle GENERATE_ENCRYPTED_WALLET', () => {
    const updateAction = { type: GENERATE_ENCRYPTED_WALLET, payload: mockWallet };
    expect(reducer(undefined, updateAction)).toEqual({ data: mockWallet, walletState: CREATED });
  });

  it('should handle UPDATE_WALLET_STATE', () => {
    const updateAction = { type: UPDATE_WALLET_STATE, payload: GENERATING };
    expect(reducer(undefined, updateAction)).toMatchObject({ walletState: GENERATING });
  });

  it('should handle DECRYPT_WALLET', () => {
    const updateAction = { type: DECRYPT_WALLET, payload: mockWallet };
    expect(reducer(undefined, updateAction)).toEqual({ data: mockWallet, walletState: DECRYPTED });
  });
});
