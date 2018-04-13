// @flow
import { combineReducers } from 'redux';
import navigationReducer from './navigationReducer';
import walletReducer from './walletReducer';

export default combineReducers({
  navigation: navigationReducer,
  wallet: walletReducer,
});
