// @flow
import * as React from 'react';
import { StackNavigator } from 'react-navigation';
import { Provider } from 'react-redux';

// screens
import Intro from './src/screens/Intro';
import NewWallet from './src/screens/NewWallet';
import Login from './src/screens/Login';
import PinCode from './src/screens/PinCode';
import BackupPhrase from './src/screens/BackupPhrase';
import LegalTerms from './src/screens/LegalTerms';

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
  },
  {
    initialRouteName: 'LegalTerms',
  },
);


const App = () => (
  <Provider store={store}>
    <RootStack />
  </Provider>
);

export default App;
