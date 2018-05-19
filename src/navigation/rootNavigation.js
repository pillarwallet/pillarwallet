// @flow
import * as React from 'react';
import type { SwitchNavigator as SwitchNavigatorType } from 'react-navigation';
import { StackNavigator, SwitchNavigator } from 'react-navigation';

// screens
import OnboardingScreen from 'screens/Onboarding';
import NewWalletScreen from 'screens/NewWallet';
import SigninScreen from 'screens/Signin';
import SignupScreen from 'screens/Signup';
import BackupPhraseScreen from 'screens/BackupPhrase';
import BackupPhraseValidateScreen from 'screens/BackupPhraseValidate';
import LegalTermsScreen from 'screens/LegalTerms';
import ImportWalletScreen from 'screens/ImportWallet';
import SetWalletPinCodeScreen from 'screens/SetWalletPinCode';
import PinCodeConfirmationScreen from 'screens/PinCodeConfirmation';
import PinCodeUnlockScreen from 'screens/PinCodeUnlock';
import WelcomeScreen from 'screens/Welcome';
import OTPScreen from 'screens/OTP';
import OTPStatusScreen from 'screens/OTPStatus';

// components
import Header from 'components/Header';

import {
  APP_FLOW,
  SIGN_UP_FLOW,
  ONBOARDING_FLOW,
  AUTH_FLOW,
  BACKUP_PHRASE,
  BACKUP_PHRASE_VALIDATE,
  SET_WALLET_PIN_CODE,
  NEW_WALLET,
  SIGN_IN,
  SIGN_UP,
  LEGAL_TERMS,
  IMPORT_WALLET,
  PIN_CODE_CONFIRMATION,
  PIN_CODE_UNLOCK,
  ONBOARDING_HOME,
  WELCOME,
  OTP,
  OTP_STATUS,
} from 'constants/navigationConstants';

import AppFlow from './appNavigation';

const renderHeader = ({ navigation, ...rest }) => {
  return <Header {...rest} stateKey={navigation.state.key} onBack={navigation.goBack} />;
};

const StackNavigatorConfig = {
  headerMode: 'screen',
  navigationOptions: {
    header: renderHeader,
    gesturesEnabled: false,
  },
};

const onBoardingFlow = StackNavigator({
  [ONBOARDING_HOME]: OnboardingScreen,
  [NEW_WALLET]: {
    screen: NewWalletScreen,
    navigationOptions: {
      header: null,
    },
  },
  [IMPORT_WALLET]: ImportWalletScreen,
  [BACKUP_PHRASE]: BackupPhraseScreen,
  [BACKUP_PHRASE_VALIDATE]: BackupPhraseValidateScreen,
  [SET_WALLET_PIN_CODE]: SetWalletPinCodeScreen,
  [PIN_CODE_CONFIRMATION]: PinCodeConfirmationScreen,
  [LEGAL_TERMS]: LegalTermsScreen,
}, StackNavigatorConfig);

const signupFlow = StackNavigator({
  [WELCOME]: WelcomeScreen,
  [SIGN_IN]: SigninScreen,
  [OTP]: OTPScreen,
  [SIGN_UP]: SignupScreen,
  [OTP_STATUS]: OTPStatusScreen,
}, StackNavigatorConfig);

const authFlow = StackNavigator({
  [PIN_CODE_UNLOCK]: PinCodeUnlockScreen,
}, StackNavigatorConfig);


const RootSwitch: SwitchNavigatorType = SwitchNavigator({
  [SIGN_UP_FLOW]: signupFlow,
  [ONBOARDING_FLOW]: onBoardingFlow,
  [AUTH_FLOW]: authFlow,
  [APP_FLOW]: AppFlow,
});

export default RootSwitch;
