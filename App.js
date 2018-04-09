// @flow
import * as React from 'react';
import { StackNavigator } from 'react-navigation';
import Intro from './screens/Intro/Intro';
import NewWallet from './screens/NewWallet/NewWallet';
import Login from './screens/Login/Login';

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
  },
  {
    initialRouteName: 'Home',
  },
);


const App = () => <RootStack />;

export default App;
