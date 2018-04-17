// @flow
import * as React from 'react';
import type { SwitchNavigator as SwitchNavigatorType } from 'react-navigation';
import { StackNavigator, SwitchNavigator, NavigationActions, HeaderBackButton } from 'react-navigation';

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

const renderHomeButton = (navigation) => {
  const onButtonClicked = () => navigation.dispatch(NavigationActions.navigate({ routeName: HOME }));
  return props => <HeaderBackButton {...props} onPress={onButtonClicked} />;
};

const onBoardingFlow = StackNavigator({
  [NEW_WALLET]: {
    screen: NewWalletScreen,
    navigationOptions: ({ navigation }) => ({
      headerLeft: renderHomeButton(navigation),
    }),
  },
  [BACKUP_PHRASE]: BackupPhraseScreen,
});

const importWalletFlow = StackNavigator({
  [IMPORT_WALLET]: {
    screen: ImportWalletScreen,
    navigationOptions: ({ navigation }) => ({
      headerLeft: renderHomeButton(navigation),
    }),
  },
});

const appFlow = StackNavigator({
  [LOGIN]: {
    screen: LoginScreen,
    navigationOptions: ({ navigation }) => ({
      headerLeft: renderHomeButton(navigation),
    }),
  },
  [ASSETS]: {
    screen: AssetsScreen,
    navigationOptions: {
      headerLeft: null,
    },
  },
  [LEGAL_TERMS]: LegalTermsScreen,
  [ICO]: ICOScreen,
});

const RootSwitch: SwitchNavigatorType = SwitchNavigator({
  [HOME]: IntroScreen,
  appFlow,
  onBoardingFlow,
  importWalletFlow,
});

export default RootSwitch;
