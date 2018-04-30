// @flow
import * as React from 'react';
import type { SwitchNavigator as SwitchNavigatorType } from 'react-navigation';
import {
  StackNavigator,
  SwitchNavigator,
  TabNavigator,
  TabBarBottom,
  NavigationActions,
  HeaderBackButton,
} from 'react-navigation';
import { Ionicons } from '@expo/vector-icons';

// screens
import IntroScreen from 'screens/Intro';
import NewWalletScreen from 'screens/NewWallet';
import LoginScreen from 'screens/Login';
import AssetsScreen from 'screens/Assets';
import BackupPhraseScreen from 'screens/BackupPhrase';
import BackupPhraseValidateScreen from 'screens/BackupPhraseValidate';
import LegalTermsScreen from 'screens/LegalTerms';
import ICOScreen from 'screens/ICO';
import ImportWalletScreen from 'screens/ImportWallet';
import SetWalletPinCodeScreen from 'screens/SetWalletPinCode';
import PinCodeConfirmationScreen from 'screens/PinCodeConfirmation';
import ProfileScreen from 'screens/Profile';

import {
  ASSETS,
  BACKUP_PHRASE,
  BACKUP_PHRASE_VALIDATE,
  SET_WALLET_PIN_CODE,
  NEW_WALLET,
  LOGIN, HOME,
  LEGAL_TERMS,
  ICO,
  IMPORT_WALLET,
  PIN_CODE_CONFIRMATION,
  PROFILE,
} from 'constants/navigationConstants';

const renderHomeButton = (navigation) => {
  const onButtonClicked = () => navigation.dispatch(NavigationActions.navigate({ routeName: HOME }));
  return props => <HeaderBackButton {...props} onPress={onButtonClicked} />;
};

const walletCreationFlow = {
  [SET_WALLET_PIN_CODE]: SetWalletPinCodeScreen,
  [PIN_CODE_CONFIRMATION]: PinCodeConfirmationScreen,
  [LEGAL_TERMS]: LegalTermsScreen,
  [NEW_WALLET]: {
    screen: NewWalletScreen,
    navigationOptions: {
      headerLeft: null,
    },
  },
};

const onBoardingFlow = StackNavigator({
  [BACKUP_PHRASE]: {
    screen: BackupPhraseScreen,
    navigationOptions: ({ navigation }) => ({
      headerLeft: renderHomeButton(navigation),
    }),
  },
  [BACKUP_PHRASE_VALIDATE]: BackupPhraseValidateScreen,
  ...walletCreationFlow,
});

const importWalletFlow = StackNavigator({
  [IMPORT_WALLET]: {
    screen: ImportWalletScreen,
    navigationOptions: ({ navigation }) => ({
      headerLeft: renderHomeButton(navigation),
    }),
  },
  ...walletCreationFlow,
});

const loginFlow = StackNavigator({
  [LOGIN]: {
    screen: LoginScreen,
    navigationOptions: ({ navigation }) => ({
      headerLeft: renderHomeButton(navigation),
    }),
  },
});

const appFlow = TabNavigator(
  {
    [ASSETS]: {
      screen: AssetsScreen,
      navigationOptions: {
        header: null,
      },
    },
    [ICO]: ICOScreen,
    [PROFILE]: ProfileScreen,
  },
  { ...getBottomNavigationOptions() }, // eslint-disable-line
);

const RootSwitch: SwitchNavigatorType = SwitchNavigator({
  [HOME]: IntroScreen,
  appFlow,
  loginFlow,
  onBoardingFlow,
  importWalletFlow,
});

export default RootSwitch;

function getBottomNavigationOptions() {
  return {
    navigationOptions: ({ navigation }) => ({
      tabBarIcon: ({ focused, tintColor }) => {
        const { routeName } = navigation.state;
        let iconName;

        switch (routeName) {
          case ASSETS:
            iconName = `ios-albums${focused ? '' : '-outline'}`; break;
          case ICO:
            iconName = `ios-jet${focused ? '' : '-outline'}`; break;
          case PROFILE:
            iconName = `ios-contact${focused ? '' : '-outline'}`; break;
          default:
            return '';
        }

        return <Ionicons name={iconName} size={25} color={tintColor} />;
      },
    }),
    tabBarOptions: {
      activeTintColor: 'blue',
      inactiveTintColor: 'gray',
    },
    tabBarComponent: TabBarBottom,
    tabBarPosition: 'bottom',
    animationEnabled: false,
    swipeEnabled: false,
  };
}
