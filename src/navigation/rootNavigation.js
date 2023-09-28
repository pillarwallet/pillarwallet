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
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { CardStyleInterpolators } from '@react-navigation/stack';

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

import { navigationRef } from 'services/navigation';

import AppFlow from './appNavigation';

type Props = {
  language: string,
};

const onBoraringFlowStack = createNativeStackNavigator();
const authFlowStack = createNativeStackNavigator();
const rootFlowStack = createNativeStackNavigator();

const StackNavigatorConfig = {
  headerShown: false,
  gestureEnabled: false,
  cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
};

function OnBoraringStackNavigator() {
  return (
    <onBoraringFlowStack.Navigator
      screenOptions={StackNavigatorConfig}
      initialRouteName={Platform.OS === 'android' ? PERMISSIONS : WELCOME}
    >
      <onBoraringFlowStack.Screen name={PERMISSIONS} component={PermissionScreen} options={StackNavigatorConfig} />
      <onBoraringFlowStack.Screen name={WELCOME} component={WelcomeScreen} options={StackNavigatorConfig} />
      <onBoraringFlowStack.Screen
        name={GET_NOTIFICATIONS}
        component={GetNotificationsScreen}
        options={StackNavigatorConfig}
      />
      <onBoraringFlowStack.Screen name={IMPORT_WALLET} component={ImportWalletScreen} options={StackNavigatorConfig} />
      <onBoraringFlowStack.Screen
        name={NEW_IMPORT_WALLET}
        component={NewImportWalletScreen}
        options={StackNavigatorConfig}
      />
      <onBoraringFlowStack.Screen
        name={SET_WALLET_PIN_CODE}
        component={SetWalletPinCodeScreen}
        options={StackNavigatorConfig}
      />
      <onBoraringFlowStack.Screen
        name={PIN_CODE_CONFIRMATION}
        component={PinCodeConfirmationScreen}
        options={StackNavigatorConfig}
      />
      <onBoraringFlowStack.Screen
        name={ENALBE_BIOMETRICS_SCREEN}
        component={EnableBiometricsScreen}
        options={StackNavigatorConfig}
      />
      <onBoraringFlowStack.Screen name={WELCOME_BACK} component={WelcomeBackScreen} options={StackNavigatorConfig} />
      <onBoraringFlowStack.Screen
        name={IMPORT_WALLET_LEGALS}
        component={ImportWalletLegalsScreen}
        options={StackNavigatorConfig}
      />
      <onBoraringFlowStack.Screen
        name={ONBOARDING_LEGAL_SCREEN}
        component={LegalScreen}
        options={StackNavigatorConfig}
      />
    </onBoraringFlowStack.Navigator>
  );
}

function AuthStackNavigator() {
  return (
    <authFlowStack.Navigator>
      <authFlowStack.Screen
        name={MENU_SELECT_APPEARANCE}
        component={MenuSelectAppearanceScreen}
        options={modalTransition}
      />
      <authFlowStack.Screen name={PIN_CODE_UNLOCK} component={PinCodeUnlockScreen} options={modalTransition} />
      <authFlowStack.Screen name={FORGOT_PIN} component={ForgotPinScreen} options={modalTransition} />
    </authFlowStack.Navigator>
  );
}

function RootNavigator({ onNavigationStateChange }) {
  return (
    <rootFlowStack.Navigator
      screenOptions={StackNavigatorConfig}
      initialRouteName={ONBOARDING_FLOW}
      screenListeners={onNavigationStateChange}
    >
      <rootFlowStack.Screen name={ONBOARDING_FLOW} component={OnBoraringStackNavigator} />
      <rootFlowStack.Screen name={AUTH_FLOW} component={AuthStackNavigator} />
      <rootFlowStack.Screen name={APP_FLOW} component={AppFlow} />
    </rootFlowStack.Navigator>
  );
}

// to pass in language prop so stacks would rerender on language change
const WrappedRootSwitch = (props: Props) => {
  const { language } = props;
  return (
    <NavigationContainer ref={navigationRef}>
      <ModalProvider />
      {/* $FlowFixMe: flow update to 0.122 */}
      <RootNavigator screenProps={{ language }} {...this.props} />
    </NavigationContainer>
  );
};

export default WrappedRootSwitch;
