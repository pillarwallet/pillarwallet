import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { generateEncryptedWalletAction } from '../walletActions';
import { UPDATE_WALLET_STATE, GENERATE_ENCRYPTED_WALLET } from '../../constants/walletConstants';

const mockStore = configureMockStore([thunk])

jest.mock('ethers', () => ({
    Wallet: {
        fromMnemonic: () => ({ encrypt: () => Promise.resolve({ address: '0x9c' }) })
    }
}))

describe('Wallet actions', () => {
    it('should expect series of actions to be dispatch on generateEncryptedWalletAction execution', () => {
        const store = mockStore({})
        const expectedActions = [
            UPDATE_WALLET_STATE, // GENERATING
            UPDATE_WALLET_STATE, // ENCRYPTING
            GENERATE_ENCRYPTED_WALLET
        ]

        return store.dispatch(generateEncryptedWalletAction())
            .then(() => {
                const actualActions = store.getActions().map(action => action.type)
                expect(actualActions).toEqual(expectedActions)
            })
    });
});