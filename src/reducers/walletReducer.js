// @flow
import { GENERATE_ENCRYPTED_WALLET, UPDATE_WALLET_STATE } from '../constants/walletConstants'

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

const initialState: WalletReducerState = {
    data: {
        address: '',
        privateKey: ''
    },
    walletState: null
}

export default function newWalletReducer(state: WalletReducerState = initialState, action: WalletReducerAction) {
    switch (action.type) {
        case GENERATE_ENCRYPTED_WALLET:
            return { ...state, ...action.payload }
        case UPDATE_WALLET_STATE:
    }       return { ...state, walletState: action.payload }
    return state;
}