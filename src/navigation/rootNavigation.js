// @flow
import type { SwitchNavigator as SwitchNavigatorType } from 'react-navigation';
import { StackNavigator, SwitchNavigator } from 'react-navigation';

// screens
import IntroScreen from 'screens/Intro';
import NewWalletScreen from 'screens/NewWallet';
import LoginScreen from 'screens/Login';
import PinCodeScreen from 'screens/PinCode';
import AssetsScreen from 'screens/Assets';
import BackupPhraseScreen from 'screens/BackupPhrase';

import { ASSETS, PIN_CODE, BACKUP_PHRASE, NEW_WALLET, LOGIN, HOME } from '../constants/navigationConstants';

const onBoardingFlow = StackNavigator({
  [NEW_WALLET]: NewWalletScreen,
  [PIN_CODE]: PinCodeScreen,
  [BACKUP_PHRASE]: BackupPhraseScreen,
});

const AppFlow = StackNavigator({
  [LOGIN]: LoginScreen,
  [ASSETS]: AssetsScreen,
});

const RootSwitch: SwitchNavigatorType = SwitchNavigator({
  [HOME]: IntroScreen,
  AppFlow,
  onBoardingFlow,
}, {
  initialRouteName: HOME,
});

export default RootSwitch;
