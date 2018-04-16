// @flow
import * as React from 'react';
import { StackNavigator } from 'react-navigation';
import { Provider } from 'react-redux';

// screens

import Intro from 'screens/Intro';
import NewWallet from 'screens/NewWallet';
import Login from 'screens/Login';
import PinCode from 'screens/PinCode';
import Assets from 'screens/Assets';
import BackupPhrase from 'screens/BackupPhrase';
import LegalTerms from 'screens/LegalTerms';

import configureStore from './src/configureStore';

const store = configureStore();

const RootStack = StackNavigator(
  {
    Home: {
      screen: Intro,
    },
    NewWallet: {
      screen: NewWallet,
    },
    Login: {
      screen: Login,
    },
    PinCode: {
      screen: PinCode,
    },
    BackupPhrase: {
      screen: BackupPhrase,
    },
    LegalTerms: {
      screen: LegalTerms,
    },
    Assets: {
      screen: Assets,
    },
  },
  {
    initialRouteName: 'Home',
  },
);


const App = () => (
  <Provider store={store}>
    <RootStack />
  </Provider>
);

export default App;
