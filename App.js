// @flow
import * as React from 'react';
import Intro from "./screens/Intro";
import { StackNavigator } from 'react-navigation';
import NewWallet from "./screens/NewWallet";
import Login from "./screens/Login";

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
