// @flow
import { GENERATE_ENCRYPTED_WALLET, UPDATE_WALLET_STATE } from '../constants/walletConstants'

type Wallet = {
    address: string,
    privateKey: string
}

type State = {
    data: Wallet,
    walletState: any
}

const initialState: State = {
    data: {
        address: null,
        privateKey: null
    },
    walletState: null
}

export default function newWalletReducer(state = initialState, action) {
    switch (action.type) {
        case GENERATE_ENCRYPTED_WALLET:
            return { ...state, ...action.payload }
        case UPDATE_WALLET_STATE:
    }       return { ...state, walletState: action.payload }
    return state;
}