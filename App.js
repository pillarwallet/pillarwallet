// @flow
import * as React from 'react';
import Intro from "./app/screens/Intro";
import { StackNavigator } from 'react-navigation';
import NewWallet from "./app/screens/NewWallet";
import Login from "./app/screens/Login";
import Pincode from "./app/screens/Pincode";

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

export default class App extends React.Component {
  render() {
    return <RootStack />;
  }
}
