// @flow
import * as React from 'react';
import { StackNavigator } from 'react-navigation';
import Intro from './screens/Intro';
import NewWallet from './screens/NewWallet';
import Login from './screens/Login';

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
    Pincode:{
      screen: Pincode,
    }
  },
  {
    initialRouteName: 'Pincode',
  }
);


const App = () => <RootStack />;

export default App;
