// @flow
import * as React from 'react';
import { Animated, Easing } from 'react-native';
import type { SwitchNavigator as SwitchNavigatorType } from 'react-navigation';
import {
  StackNavigator,
  SwitchNavigator,
  TabNavigator,
  TabBarBottom,
} from 'react-navigation';
import { Ionicons } from '@expo/vector-icons';

// screens
import OnboardingScreen from 'screens/Onboarding';
import NewWalletScreen from 'screens/NewWallet';
import SigninScreen from 'screens/Signin';
import SignupScreen from 'screens/Signup';
import AssetsScreen from 'screens/Assets';
import BackupPhraseScreen from 'screens/BackupPhrase';
import BackupPhraseValidateScreen from 'screens/BackupPhraseValidate';
import LegalTermsScreen from 'screens/LegalTerms';
import ICOScreen from 'screens/ICO';
import ImportWalletScreen from 'screens/ImportWallet';
import SetWalletPinCodeScreen from 'screens/SetWalletPinCode';
import PinCodeConfirmationScreen from 'screens/PinCodeConfirmation';
import PinCodeUnlockScreen from 'screens/PinCodeUnlock';
import WelcomeScreen from 'screens/Welcome';
import OTPScreen from 'screens/OTP';
import OTPStatusScreen from 'screens/OTPStatus';
import ProfileScreen from 'screens/Profile';

// components
import Header from 'components/Header';

import {
  APP_FLOW,
  SIGN_UP_FLOW,
  ONBOARDING_FLOW,
  AUTH_FLOW,
  ASSETS,
  BACKUP_PHRASE,
  BACKUP_PHRASE_VALIDATE,
  SET_WALLET_PIN_CODE,
  NEW_WALLET,
  SIGN_IN,
  SIGN_UP,
  LEGAL_TERMS,
  ICO,
  IMPORT_WALLET,
  PIN_CODE_CONFIRMATION,
  PIN_CODE_UNLOCK,
  ONBOARDING_HOME,
  WELCOME,
  OTP,
  OTP_STATUS,
  PROFILE,
} from 'constants/navigationConstants';

const renderHeader = ({ navigation, ...rest }) => {
  return <Header {...rest} stateKey={navigation.state.key} onBack={navigation.goBack} />;
};

const StackNavigatorConfig = {
  headerMode: 'float',
  transitionConfig: () => ({
    transitionSpec: {
      duration: 0,
      timing: Animated.timing,
      easing: Easing.step0,
    },
  }),
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
      headerLeft: null,
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

const appFlow = TabNavigator(
  {
    [ASSETS]: AssetsScreen,
    [ICO]: ICOScreen,
    [PROFILE]: ProfileScreen,
  },
  { ...getBottomNavigationOptions() }, // eslint-disable-line
);

const RootSwitch: SwitchNavigatorType = SwitchNavigator({
  [SIGN_UP_FLOW]: signupFlow,
  [ONBOARDING_FLOW]: onBoardingFlow,
  [AUTH_FLOW]: authFlow,
  [APP_FLOW]: appFlow,
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
