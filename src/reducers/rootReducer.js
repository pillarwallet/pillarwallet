import { combineReducers } from 'redux'
import walletReducer from './walletReducer.js'

export default combineReducers({
    wallet: walletReducer
});