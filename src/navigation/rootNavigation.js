// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import * as React from 'react';
import { Platform } from 'react-native';
import { createSwitchNavigator, createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

// Screens
import WelcomeBackScreen from 'screens/WelcomeBack';
import WelcomeScreen from 'screens/Welcome';
import ImportWalletScreen from 'screens/ImportWallet';
import NewImportWalletScreen from 'screens/ImportWallet/NewImportWallet';
import ImportWalletLegalsScreen from 'screens/ImportWallet/ImportWalletLegals';
import SetWalletPinCodeScreen from 'screens/SetWalletPinCode';
import PinCodeConfirmationScreen from 'screens/PinCodeConfirmation';
import PinCodeUnlockScreen from 'screens/PinCodeUnlock';
import ForgotPinScreen from 'screens/ForgotPin';
import PermissionScreen from 'screens/Permissions';
import MenuSelectAppearanceScreen from 'screens/AppAppearence';
import LegalScreen from 'screens/LegalScreen/LegalScreen';
import GetNotificationsScreen from 'screens/Notification/GetNotifications';
import EnableBiometricsScreen from 'screens/BiometricsPrompt/EnableBiometricsScreen';

// Utils
import { modalTransition } from 'utils/common';

// Components
import { ModalProvider } from 'components/Modal';

// Constants
import {
  APP_FLOW,
  ONBOARDING_FLOW,
  AUTH_FLOW,
  SET_WALLET_PIN_CODE,
  WELCOME_BACK,
  WELCOME,
  GET_NOTIFICATIONS,
  IMPORT_WALLET,
  PIN_CODE_CONFIRMATION,
  PIN_CODE_UNLOCK,
  FORGOT_PIN,
  IMPORT_WALLET_LEGALS,
  PERMISSIONS,
  MENU_SELECT_APPEARANCE,
  ONBOARDING_LEGAL_SCREEN,
  ENALBE_BIOMETRICS_SCREEN,
  NEW_IMPORT_WALLET,
} from 'constants/navigationConstants';

import type { NavigationNavigator } from 'react-navigation';

import AppFlow from './appNavigation';

type Props = {
  language: string,
};

const StackNavigatorConfig = {
  defaultNavigationOptions: {
    headerShown: false,
    gestureEnabled: false,
  },
  initialRouteName: Platform.OS === 'android' ? PERMISSIONS : WELCOME,
};

const onBoardingFlow = createStackNavigator(
  {
    [PERMISSIONS]: PermissionScreen,
    [WELCOME]: WelcomeScreen,
    [GET_NOTIFICATIONS]: GetNotificationsScreen,
    [IMPORT_WALLET]: ImportWalletScreen,
    [NEW_IMPORT_WALLET]: NewImportWalletScreen,
    [SET_WALLET_PIN_CODE]: SetWalletPinCodeScreen,
    [PIN_CODE_CONFIRMATION]: PinCodeConfirmationScreen,
    [ENALBE_BIOMETRICS_SCREEN]: EnableBiometricsScreen,
    [WELCOME_BACK]: WelcomeBackScreen,
    [IMPORT_WALLET_LEGALS]: ImportWalletLegalsScreen,
    [ONBOARDING_LEGAL_SCREEN]: LegalScreen,
  },
  StackNavigatorConfig,
);

const authFlow = createStackNavigator(
  {
    [MENU_SELECT_APPEARANCE]: MenuSelectAppearanceScreen,
    [PIN_CODE_UNLOCK]: PinCodeUnlockScreen,
    [FORGOT_PIN]: ForgotPinScreen,
  },
  modalTransition,
);

const RootSwitch: NavigationNavigator<any, {}, {}> = createSwitchNavigator({
  [ONBOARDING_FLOW]: onBoardingFlow,
  [AUTH_FLOW]: authFlow,
  [APP_FLOW]: AppFlow,
});

// to pass in language prop so stacks would rerender on language change
class WrappedRootSwitch extends React.Component<Props> {
  static router = RootSwitch.router;
  render() {
    const { language } = this.props;
    return (
      <>
        <ModalProvider />
        {/* $FlowFixMe: flow update to 0.122 */}
        <RootSwitch screenProps={{ language }} {...this.props} />
      </>
    );
  }
}

export default createAppContainer<any, {}>(WrappedRootSwitch);
