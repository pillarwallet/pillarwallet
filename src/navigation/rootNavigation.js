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
import type { SwitchNavigator as SwitchNavigatorType } from 'react-navigation';
import { createStackNavigator, createSwitchNavigator, createAppContainer } from 'react-navigation';

// screens
import NewWalletScreen from 'screens/NewWallet';
import NewProfileScreen from 'screens/NewProfile';
import PermissionsScreen from 'screens/Permissions';
import ImportWalletScreen from 'screens/ImportWallet';
import ImportWalletLegalsScreen from 'screens/ImportWallet/ImportWalletLegals';
import SetWalletPinCodeScreen from 'screens/SetWalletPinCode';
import PinCodeConfirmationScreen from 'screens/PinCodeConfirmation';
import PinCodeUnlockScreen from 'screens/PinCodeUnlock';
import WelcomeScreen from 'screens/Welcome';
import ForgotPinScreen from 'screens/ForgotPin';
import BiometricsPromptScreen from 'screens/BiometricsPrompt';
import WalletRecoveryOptionsScreen from 'screens/ImportWallet/WalletRecoveryOptions';
import RecoveryPortalWalletRecoveryIntroScreen from 'screens/RecoveryPortal/RecoveryPortalWalletRecoveryIntro';
import RecoveryPortalWalletRecoveryScreen from 'screens/RecoveryPortal/RecoveryPortalWalletRecovery';

import { modalTransition } from 'utils/common';
import { ModalProvider } from 'components/Modal';

import {
  APP_FLOW,
  ONBOARDING_FLOW,
  AUTH_FLOW,
  SET_WALLET_PIN_CODE,
  NEW_WALLET,
  NEW_PROFILE,
  IMPORT_WALLET,
  PIN_CODE_CONFIRMATION,
  PIN_CODE_UNLOCK,
  WELCOME,
  FORGOT_PIN,
  PERMISSIONS,
  IMPORT_WALLET_LEGALS,
  BIOMETRICS_PROMPT,
  WALLET_RECOVERY_OPTIONS,
  RECOVERY_PORTAL_WALLET_RECOVERY,
  RECOVERY_PORTAL_WALLET_RECOVERY_INTRO,
} from 'constants/navigationConstants';

import AppFlow from './appNavigation';

type Props = {
  language: string,
};

const StackNavigatorConfig = {
  defaultNavigationOptions: {
    header: null,
    gesturesEnabled: true,
  },
};

const onBoardingFlow = createStackNavigator({
  [WELCOME]: {
    screen: WelcomeScreen,
    defaultNavigationOptions: {
      header: null,
    },
  },
  [PERMISSIONS]: PermissionsScreen,
  [NEW_WALLET]: {
    screen: NewWalletScreen,
    defaultNavigationOptions: {
      header: null,
    },
  },
  [IMPORT_WALLET_LEGALS]: ImportWalletLegalsScreen,
  [IMPORT_WALLET]: ImportWalletScreen,
  [WALLET_RECOVERY_OPTIONS]: WalletRecoveryOptionsScreen,
  [RECOVERY_PORTAL_WALLET_RECOVERY_INTRO]: RecoveryPortalWalletRecoveryIntroScreen,
  [RECOVERY_PORTAL_WALLET_RECOVERY]: RecoveryPortalWalletRecoveryScreen,
  [SET_WALLET_PIN_CODE]: SetWalletPinCodeScreen,
  [PIN_CODE_CONFIRMATION]: PinCodeConfirmationScreen,
  [BIOMETRICS_PROMPT]: BiometricsPromptScreen,
  [NEW_PROFILE]: NewProfileScreen,
}, StackNavigatorConfig);

const authFlow = createStackNavigator({
  [PIN_CODE_UNLOCK]: PinCodeUnlockScreen,
  [FORGOT_PIN]: ForgotPinScreen,
}, modalTransition);

const RootSwitch: SwitchNavigatorType = createSwitchNavigator({
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
        <RootSwitch screenProps={{ language }} {...this.props} />
      </>
    );
  }
}

export default createAppContainer(WrappedRootSwitch);
