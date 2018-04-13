// @flow
import * as React from 'react';
import type { SwitchNavigator as SwitchNavigatorType } from 'react-navigation';
import { Text } from 'react-native';
import { StackNavigator, addNavigationHelpers, SwitchNavigator } from 'react-navigation';
import { ASSETS, PIN_CODE, BACKUP_PHRASE, NEW_WALLET, LOGIN, HOME } from '../constants/navigationConstants';

// screens
import IntroScreen from 'screens/Intro';
import NewWalletScreen from 'screens/NewWallet';
import LoginScreen from 'screens/Login';
import PinCodeScreen from 'screens/PinCode';
import AssetsScreen from 'screens/Assets';
import BackupPhraseScreen from 'screens/BackupPhrase';

const onBoardingFlow = StackNavigator({
  [NEW_WALLET]: NewWalletScreen,
  [PIN_CODE]: PinCodeScreen,
  [BACKUP_PHRASE]: BackupPhraseScreen,
});

const AppFlow = StackNavigator({
  [LOGIN]: LoginScreen,
  [ASSETS]: AssetsScreen,
})

const RootSwitch: SwitchNavigatorType = SwitchNavigator({
  [HOME]: IntroScreen,
  AppFlow,
  onBoardingFlow
}, { 
  initialRouteName: HOME, 
});

export default RootSwitch;
