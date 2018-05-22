// @flow
import * as React from 'react';
import type { SwitchNavigator as SwitchNavigatorType } from 'react-navigation';
import {
  StackNavigator,
  SwitchNavigator,
  TabNavigator,
  TabBarBottom,
} from 'react-navigation';
import { Animated, Easing } from 'react-native';
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
import AddTokenScreen from 'screens/AddToken';
import SendTokenAmountScreen from 'screens/SendTokenAmount';
import SendTokenContactsScreen from 'screens/SendTokenContacts';

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
  ADD_TOKEN,
  TAB_NAVIGATION,
  SEND_TOKEN_FLOW,
  SEND_TOKEN_AMOUNT,
  SEND_TOKEN_CONTACTS,
} from 'constants/navigationConstants';

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

const StackNavigatorModalConfig = {
  headerMode: 'float',
  mode: 'modal',
  transitionConfig: () => ({
    transitionSpec: {
      duration: 0,
      timing: Animated.timing,
      easing: Easing.step0,
    },
  }),
  navigationOptions: {
    header: false,
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

const sendTokenFlow = StackNavigator({
  [SEND_TOKEN_AMOUNT]: SendTokenAmountScreen,
  [SEND_TOKEN_CONTACTS]: SendTokenContactsScreen,
}, StackNavigatorModalConfig);

const authFlow = StackNavigator({
  [PIN_CODE_UNLOCK]: PinCodeUnlockScreen,
}, StackNavigatorConfig);

const tabNavigation = TabNavigator(
  {
    [ASSETS]: AssetsScreen,
    [ICO]: ICOScreen,
    [PROFILE]: ProfileScreen,
  }, {
    ...getBottomNavigationOptions() // eslint-disable-line
  },
);

const appFlow = StackNavigator(
  {
    [TAB_NAVIGATION]: tabNavigation,
    [ADD_TOKEN]: AddTokenScreen,
    [SEND_TOKEN_FLOW]: sendTokenFlow,
  }, {
    mode: 'modal',
    navigationOptions: {
      header: null,
    },
  },
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
      activeBackgroundColor: 'white',
      inactiveBackgroundColor: 'white',
      style: {
        backgroundColor: 'white',
      },
    },
    tabBarComponent: TabBarBottom,
    tabBarPosition: 'bottom',
    animationEnabled: true,
    swipeEnabled: false,
  };
}
