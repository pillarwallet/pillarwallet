// @flow
import { combineReducers } from 'redux';
import walletReducer from './walletReducer';
import assetsReducer from './assetsReducer';

export default combineReducers({
  wallet: walletReducer,
  assets: assetsReducer,
});
