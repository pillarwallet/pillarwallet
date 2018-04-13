// @flow
import * as React from 'react';
import { StackNavigator } from 'react-navigation';
import { Provider } from 'react-redux';

// Screens
import Intro from 'screens/Intro';
import NewWallet from 'screens/NewWallet';
import Login from 'screens/Login';
import PinCode from 'screens/PinCode';
import Assets from 'screens/Assets';
import BackupPhrase from 'screens/BackupPhrase';
import configureStore from './src/configureStore';
import StorybookUI from './storybook'; // eslint-disable-line
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
    Assets: {
      screen: Assets,
    },
    Storybook: {
      screen: StorybookUI,
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
