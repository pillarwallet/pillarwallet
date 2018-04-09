// @flow
import * as React from 'react';
import Intro from "./app/screens/Intro";
import { StackNavigator } from 'react-navigation';
import NewWallet from "./app/screens/NewWallet";
import Login from "./app/screens/Login";

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
  }
);

export default class App extends React.Component {
  render() {
    return <RootStack />;
  }
}
