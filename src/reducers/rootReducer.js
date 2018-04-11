// @flow
import { combineReducers } from 'redux';
import walletReducer from './walletReducer';

export default combineReducers({
  wallet: walletReducer,
});
