// @flow
import * as React from 'react';
import { StackNavigator } from 'react-navigation';
import Intro from './src/screens/Intro';
import NewWallet from './src/screens/NewWallet';
import Login from './src/screens/Login';
import PinCode from './src/screens/PinCode';
import BackupPhrase from './src/screens/BackupPhrase/BackupPhrase';

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
  },
  {
    initialRouteName: 'BackupPhrase',
  },
);


const App = () => <RootStack />;

export default App;
