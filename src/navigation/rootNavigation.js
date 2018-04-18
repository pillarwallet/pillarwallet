// @flow
import type { SwitchNavigator as SwitchNavigatorType } from 'react-navigation';
import { StackNavigator, SwitchNavigator } from 'react-navigation';

// screens
import IntroScreen from 'screens/Intro';
import NewWalletScreen from 'screens/NewWallet';
import LoginScreen from 'screens/Login';
import AssetsScreen from 'screens/Assets';
import BackupPhraseScreen from 'screens/BackupPhrase';
import LegalTermsScreen from 'screens/LegalTerms';
import ICOScreen from 'screens/ICO';
import ImportWalletScreen from 'screens/ImportWallet';

import {
  ASSETS,
  BACKUP_PHRASE,
  NEW_WALLET,
  LOGIN, HOME,
  LEGAL_TERMS,
  ICO,
  IMPORT_WALLET,
} from 'constants/navigationConstants';

const onBoardingFlow = StackNavigator({
  [NEW_WALLET]: NewWalletScreen,
  [BACKUP_PHRASE]: BackupPhraseScreen,
});

const importWalletFlow = StackNavigator({
  [IMPORT_WALLET]: ImportWalletScreen,
});

const appFlow = StackNavigator({
  [LOGIN]: LoginScreen,
  [ASSETS]: AssetsScreen,
  [LEGAL_TERMS]: LegalTermsScreen,
  [ICO]: ICOScreen,
});

const RootSwitch: SwitchNavigatorType = SwitchNavigator({
  [HOME]: AssetsScreen,
  appFlow,
  onBoardingFlow,
  importWalletFlow,
}, {
  initialRouteName: HOME,
});

export default RootSwitch;
