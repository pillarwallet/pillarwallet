// @flow
import * as React from 'react';
import { Text } from 'react-native';
import type { SwitchNavigator as SwitchNavigatorType } from 'react-navigation';
import { StackNavigator, SwitchNavigator, NavigationActions } from 'react-navigation';

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
  [NEW_WALLET]: {
    screen:NewWalletScreen,
    navigationOptions: ({ navigation }) => ({
      headerLeft: () => <Text onPress={() => { navigation.dispatch(NavigationActions.navigate({ routeName: HOME })) }}>{'Home'}</Text>
    })
  },
  [BACKUP_PHRASE]: BackupPhraseScreen,
});

const importWalletFlow = StackNavigator({
  [IMPORT_WALLET]: {
    screen: ImportWalletScreen,
    navigationOptions: ({ navigation }) => ({
      headerLeft: () => <Text onPress={() => { navigation.dispatch(NavigationActions.navigate({ routeName: HOME })) }}>{'Home'}</Text>
    })
  },
});

const appFlow = StackNavigator({
  [LOGIN]: {
    screen:LoginScreen,
    navigationOptions: ({ navigation }) => ({
      headerLeft: () => <Text onPress={() => { navigation.dispatch(NavigationActions.navigate({ routeName: HOME })) }}>{'Home'}</Text>,
    })
  },
  [ASSETS]: {
    screen: AssetsScreen,
    navigationOptions: {
      header: null
    }
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
