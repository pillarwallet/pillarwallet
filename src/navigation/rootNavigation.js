// @flow
import * as React from 'react';
import type { SwitchNavigator as SwitchNavigatorType } from 'react-navigation';
import { createStackNavigator, createSwitchNavigator } from 'react-navigation';
import BackButton from 'components/BackButton';
import { baseColors } from 'utils/variables';
// screens
import OnboardingScreen from 'screens/Onboarding';
import NewWalletScreen from 'screens/NewWallet';
import NewProfileScreen from 'screens/NewProfile';
import SecurityConfirmScreen from 'screens/SecurityConfirm';
import BackupPhraseScreen from 'screens/BackupPhrase';
import BackupPhraseValidateScreen from 'screens/BackupPhraseValidate';
import LegalTermsScreen from 'screens/LegalTerms';
import ImportWalletScreen from 'screens/ImportWallet';
import SetWalletPinCodeScreen from 'screens/SetWalletPinCode';
import PinCodeConfirmationScreen from 'screens/PinCodeConfirmation';
import PinCodeUnlockScreen from 'screens/PinCodeUnlock';
import WelcomeScreen from 'screens/Welcome';

import {
  APP_FLOW,
  ONBOARDING_FLOW,
  AUTH_FLOW,
  SECURITY_CONFIRM,
  BACKUP_PHRASE,
  BACKUP_PHRASE_VALIDATE,
  SET_WALLET_PIN_CODE,
  NEW_WALLET,
  NEW_PROFILE,
  LEGAL_TERMS,
  IMPORT_WALLET,
  PIN_CODE_CONFIRMATION,
  PIN_CODE_UNLOCK,
  ONBOARDING_HOME,
  WELCOME,
} from 'constants/navigationConstants';

import AppFlow from './appNavigation';

const StackNavigatorConfig = {
  headerMode: 'screen',
  navigationOptions: ({ navigation }) => ({
    headerStyle: {
      backgroundColor: baseColors.white,
      borderBottomWidth: 0,
      elevation: 0,
    },
    headerLeft: <BackButton navigation={navigation} />,
  }),
};

const onBoardingFlow = createStackNavigator({
  [WELCOME]: WelcomeScreen,
  [ONBOARDING_HOME]: OnboardingScreen,
  [NEW_WALLET]: {
    screen: NewWalletScreen,
    navigationOptions: {
      header: null,
    },
  },
  [IMPORT_WALLET]: ImportWalletScreen,
  [SECURITY_CONFIRM]: SecurityConfirmScreen,
  [BACKUP_PHRASE]: BackupPhraseScreen,
  [BACKUP_PHRASE_VALIDATE]: BackupPhraseValidateScreen,
  [SET_WALLET_PIN_CODE]: SetWalletPinCodeScreen,
  [PIN_CODE_CONFIRMATION]: PinCodeConfirmationScreen,
  [NEW_PROFILE]: NewProfileScreen,
  [LEGAL_TERMS]: LegalTermsScreen,
}, StackNavigatorConfig);

const authFlow = createStackNavigator({
  [PIN_CODE_UNLOCK]: PinCodeUnlockScreen,
}, StackNavigatorConfig);

const RootSwitch: SwitchNavigatorType = createSwitchNavigator({
  [ONBOARDING_FLOW]: onBoardingFlow,
  [AUTH_FLOW]: authFlow,
  [APP_FLOW]: AppFlow,
});

export default RootSwitch;
