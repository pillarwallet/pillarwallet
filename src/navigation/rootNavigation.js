// @flow
import * as React from 'react';
import type { SwitchNavigator as SwitchNavigatorType } from 'react-navigation';
import { StackNavigator, SwitchNavigator, NavigationActions, HeaderBackButton } from 'react-navigation';

// screens
import LandingScreen from 'screens/Landing';
import NewWalletScreen from 'screens/NewWallet';
import LoginScreen from 'screens/Login';
import LoginConfirmScreen from 'screens/LoginConfirm';
import PinCodeUnlockScreen from 'screens/PinCodeUnlock';
import AssetsScreen from 'screens/Assets';
import BackupPhraseScreen from 'screens/BackupPhrase';
import BackupPhraseValidateScreen from 'screens/BackupPhraseValidate';
import LegalTermsScreen from 'screens/LegalTerms';
import ICOScreen from 'screens/ICO';
import ImportWalletScreen from 'screens/ImportWallet';
import SetWalletPinCodeScreen from 'screens/SetWalletPinCode';
import PinCodeConfirmationScreen from 'screens/PinCodeConfirmation';

import {
  ASSETS,
  BACKUP_PHRASE,
  BACKUP_PHRASE_VALIDATE,
  SET_WALLET_PIN_CODE,
  NEW_WALLET,
  LOGIN,
  LOGIN_CONFIRM,
  HOME,
  LEGAL_TERMS,
  ICO,
  IMPORT_WALLET,
  PIN_CODE_CONFIRMATION,
  PIN_CODE_UNLOCK,
} from 'constants/navigationConstants';

const renderHomeButton = (navigation) => {
  const onButtonClicked = () => navigation.dispatch(NavigationActions.navigate({ routeName: HOME }));
  return props => <HeaderBackButton {...props} onPress={onButtonClicked} />;
};

const loginFlow = StackNavigator({
  [LOGIN]: LoginScreen,
  [LOGIN_CONFIRM]: LoginConfirmScreen,
});

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

const appFlow = StackNavigator({
  [PIN_CODE_UNLOCK]: {
    screen: PinCodeUnlockScreen,
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
  [ICO]: ICOScreen,
});

const RootSwitch: SwitchNavigatorType = SwitchNavigator({
  [HOME]: LandingScreen,
  loginFlow,
  appFlow,
  onBoardingFlow,
  importWalletFlow,
});

export default RootSwitch;
