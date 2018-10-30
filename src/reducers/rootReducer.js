// @flow
import { combineReducers } from 'redux';

// constants
import { LOG_OUT } from 'constants/authConstants';

// reducers
import walletReducer from './walletReducer';
import assetsReducer from './assetsReducer';
import appSettingsReducer from './appSettingsReducer';
import ratesReducer from './ratesReducer';
import userReducer from './userReducer';
import historyReducer from './historyReducer';
import notificationsReducer from './notificationsReducer';
import contactsReducer from './contactsReducer';
import invitationsReducer from './invitationsReducer';
import chatReducer from './chatReducer';
import accessTokensReducer from './accessTokensReducer';
import sessionReducer from './sessionReducer';
import icosReducer from './icosReducer';

const appReducer = combineReducers({
  wallet: walletReducer,
  assets: assetsReducer,
  appSettings: appSettingsReducer,
  rates: ratesReducer,
  user: userReducer,
  history: historyReducer,
  notifications: notificationsReducer,
  contacts: contactsReducer,
  invitations: invitationsReducer,
  chat: chatReducer,
  accessTokens: accessTokensReducer,
  session: sessionReducer,
  icos: icosReducer,
});

const initialState = appReducer(undefined, {});

const rootReducer = (state: Object, action: Object) => {
  if (action.type === LOG_OUT) {
    return initialState;
  }
  return appReducer(state, action);
};

export default rootReducer;
