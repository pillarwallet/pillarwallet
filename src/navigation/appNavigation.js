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
import type { NativeStackNavigationProp as NavigationScreenProp } from '@react-navigation/native-stack';

import BackgroundTimer from 'react-native-background-timer';
import { connect } from 'react-redux';
import { AppState } from 'react-native';
import { withTheme } from 'styled-components/native';
import { withTranslation } from 'react-i18next';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CardStyleInterpolators } from '@react-navigation/stack';

// screens
import ExchangeConfirmScreen from 'screens/Exchange/ExchangeConfirm';
import ChangePinCurrentPinScreen from 'screens/ChangePin/CurrentPin';
import ChangePinNewPinScreen from 'screens/ChangePin/NewPin';
import ChangePinConfirmNewPinScreen from 'screens/ChangePin/ConfirmNewPin';
import RevealBackupPhraseScreen from 'screens/RevealBackupPhrase';
import SendTokenPinConfirmScreen from 'screens/SendToken/SendTokenPinConfirmScreen';
import SendTokenConfirmScreen from 'screens/SendToken/SendTokenConfirm';
import SendTokenTransactionScreen from 'screens/SendToken/SendTokenTransaction';
import SendCollectibleConfirmScreen from 'screens/SendCollectible/SendCollectibleConfirm';
import HomeScreen from 'screens/Home';
import WalletConnectHomeScreen from 'screens/WalletConnect/Home';
import WalletConnectConnectedAppsScreen from 'screens/WalletConnect/ConnectedApps';
import WalletConnectConnectorRequestScreen from 'screens/WalletConnect/WalletConnectConnectorRequest';
import WalletConnectCallRequestScreen from 'screens/WalletConnect/CallRequest/WalletConnectCallRequestScreen';
import WalletConnectPinConfirm from 'screens/WalletConnect/WalletConnectPinConfirm';
import EtherspotDeploymentInterjection from 'screens/EtherspotDeploymentInterjection';
import AccountsScreen from 'screens/Accounts';
import LogoutPendingScreen from 'screens/LogoutPending';
// import StorybookScreen from 'screens/Storybook';
import MenuScreen from 'screens/Menu/Menu';
import MenuSettingsScreen from 'screens/Menu/Settings';
import MenuSelectLanguageScreen from 'screens/Menu/SelectLanguage';
import MenuSelectAppearanceScreen from 'screens/AppAppearence';
import MenuSelectCurrencyScreen from 'screens/Menu/SelectCurrency';
import WebViewScreen from 'screens/WebView/WebViewScreen';
import PinCodeUnlockScreen from 'screens/PinCodeUnlock';
import ContactsListScreen from 'screens/Contacts/ContactsList';
import TutorialScreen from 'screens/Tutorial';
import LegalScreen from 'screens/LegalScreen/LegalScreen';
import BackupWalletIntro from 'screens/BackupWallet/Intro';
import BackupPhraseValidateScreen from 'screens/BackupWallet/BackupPhraseValidate';
import WelcomeBackScreen from 'screens/WelcomeBack';
import ImportWalletScreen from 'screens/ImportWallet';
import SetWalletPinCodeScreen from 'screens/SetWalletPinCode';
import PinCodeConfirmationScreen from 'screens/PinCodeConfirmation';
import WalletConnectBrowser from 'screens/WalletConnect/WalletConnectBrowser';
import AddTokensScreen from 'screens/Assets/AddTokens';
import TokenWithToggles from 'screens/Assets/TokensWithToggles';
import ManageTokenLists from 'screens/Assets/ManageTokenLists';

// components
import Toast from 'components/Toast';
import UsernameFailed from 'components/UsernameFailed';

// actions
import { stopListeningNotificationsAction, startListeningNotificationsAction } from 'actions/notificationsActions';
import { removePrivateKeyFromMemoryAction } from 'actions/walletActions';
import { endWalkthroughAction } from 'actions/walkthroughsActions';
import { handleSystemDefaultThemeChangeAction } from 'actions/appSettingsActions';
import { handleSystemLanguageChangeAction } from 'actions/sessionActions';
import { initWalletConnectSessionsAction } from 'actions/walletConnectSessionsActions';

// constants
import {
  ASSETS,
  EXCHANGE_CONFIRM,
  HOME,
  HOME_FLOW,
  ETHERSPOT_DEPLOYMENT_INTERJECTION,
  CHANGE_PIN_FLOW,
  CHANGE_PIN_CURRENT_PIN,
  CHANGE_PIN_NEW_PIN,
  CHANGE_PIN_CONFIRM_NEW_PIN,
  SEND_TOKEN_CONFIRM,
  SEND_TOKEN_TRANSACTION,
  SEND_TOKEN_FROM_ASSET_FLOW,
  SEND_TOKEN_FROM_CONTACT_FLOW,
  SEND_TOKEN_PIN_CONFIRM,
  REVEAL_BACKUP_PHRASE,
  BACKUP_WALLET_INTRO,
  BACKUP_PHRASE_VALIDATE,
  BACKUP_WALLET_IN_SETTINGS_FLOW,
  SEND_COLLECTIBLE_FROM_ASSET_FLOW,
  SEND_COLLECTIBLE_CONFIRM,
  WALLETCONNECT_FLOW,
  WALLETCONNECT,
  WALLETCONNECT_CONNECTED_APPS,
  WALLETCONNECT_CONNECTOR_REQUEST_SCREEN,
  WALLETCONNECT_CALL_REQUEST_SCREEN,
  WALLETCONNECT_PIN_CONFIRM_SCREEN,
  WALLETCONNECT_BROWSER,
  MANAGE_WALLETS_FLOW,
  ACCOUNTS,
  MENU_FLOW,
  MENU,
  MENU_SETTINGS,
  MENU_SELECT_LANGUAGE,
  MENU_SELECT_APPEARANCE,
  MENU_SELECT_CURRENCY,
  PPN_SEND_SYNTHETIC_ASSET_FLOW,
  LOGOUT_PENDING,
  // STORYBOOK,
  CONNECT_FLOW,
  SEND_TOKEN_FROM_HOME_FLOW,
  PIN_CODE,
  CONTACTS_LIST,
  CONTACTS_FLOW,
  EXCHANGE_FLOW,
  WALLETCONNECT_CALL_REQUEST_FLOW,
  TUTORIAL,
  TUTORIAL_FLOW,
  WEB_VIEW,
  ENS_MIGRATION_FLOW,
  LEGAL_SCREEN,
  SET_WALLET_PIN_CODE,
  WELCOME_BACK,
  IMPORT_WALLET,
  PIN_CODE_CONFIRMATION,
  IMPORT_FLOW_FROM_SETTINGS,
  ADD_TOKENS,
  TOKENS_WITH_TOGGLES,
  MANAGE_TOKEN_LISTS,
} from 'constants/navigationConstants';
import { DARK_THEME } from 'constants/appSettingsConstants';

// utils
import { modalTransition, addAppStateChangeListener } from 'utils/common';
import { getThemeByType, getThemeColors } from 'utils/themes';

// Services
import { setLastRouteState } from 'services/navigation';

// types
import type { Theme } from 'models/Theme';
import type { I18n } from 'models/Translations';
import type { Notification } from 'models/Notification';
import type { EthereumWallet } from 'models/Wallet';
import type { BackupStatus } from 'reducers/walletReducer';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

const SLEEP_TIMEOUT = 20000;
const ACTIVE_APP_STATE = 'active';
const BACKGROUND_APP_STATE = 'background';
const APP_LOGOUT_STATES = [BACKGROUND_APP_STATE];

const StackNavigatorModalConfig = {
  headerShown: false,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

const StackNavigatorConfig = {
  headerShown: false,
  gestureEnabled: true,
  cardStyle: {
    backgroundColor: {
      dark: getThemeColors(getThemeByType(DARK_THEME)).basic070,
      light: getThemeColors(getThemeByType()).basic070,
    },
  },
};

const StackNavigatorConfigDisableGesture = {
  headerShown: false,
  gestureEnabled: false,
  cardStyle: {
    backgroundColor: {
      dark: getThemeColors(getThemeByType(DARK_THEME)).basic070,
      light: getThemeColors(getThemeByType()).basic070,
    },
  },
};

// ASSETS FLOW
const assetsFlowNavigator = createNativeStackNavigator();
function AssetsFlow() {
  return (
    <assetsFlowNavigator.Navigator screenOptions={StackNavigatorConfig}>
      <assetsFlowNavigator.Screen name={ADD_TOKENS} component={AddTokensScreen} />
      <assetsFlowNavigator.Screen name={TOKENS_WITH_TOGGLES} component={TokenWithToggles} />
      <assetsFlowNavigator.Screen name={MANAGE_TOKEN_LISTS} component={ManageTokenLists} />
    </assetsFlowNavigator.Navigator>
  );
}

const exchangeFlowNavigator = createNativeStackNavigator();
function ExchangeFlow() {
  return (
    <exchangeFlowNavigator.Navigator screenOptions={StackNavigatorConfigDisableGesture}>
      <exchangeFlowNavigator.Screen name={EXCHANGE_CONFIRM} component={ExchangeConfirmScreen} />
      <exchangeFlowNavigator.Screen name={SEND_TOKEN_PIN_CONFIRM} component={SendTokenPinConfirmScreen} />
      <exchangeFlowNavigator.Screen name={SEND_TOKEN_TRANSACTION} component={SendTokenTransactionScreen} />
    </exchangeFlowNavigator.Navigator>
  );
}

// WALLETCONNECT CALL REQUEST FLOW
const walletConnectCallRequestFlowNavigator = createNativeStackNavigator();
function WalletConnectCallRequestFlow() {
  return (
    <walletConnectCallRequestFlowNavigator.Navigator screenOptions={StackNavigatorConfig}>
      <walletConnectCallRequestFlowNavigator.Screen
        name={WALLETCONNECT_PIN_CONFIRM_SCREEN}
        component={WalletConnectPinConfirm}
      />
      <walletConnectCallRequestFlowNavigator.Screen
        name={SEND_TOKEN_TRANSACTION}
        component={SendTokenTransactionScreen}
      />
    </walletConnectCallRequestFlowNavigator.Navigator>
  );
}

// WALLETCONNECT FLOW
const walletConnectFlowNavigator = createNativeStackNavigator();
function WalletConnectFlow() {
  return (
    <walletConnectFlowNavigator.Navigator screenOptions={StackNavigatorConfig}>
      <walletConnectFlowNavigator.Screen name={WALLETCONNECT} component={WalletConnectHomeScreen} />
      <walletConnectFlowNavigator.Screen
        name={WALLETCONNECT_CONNECTED_APPS}
        component={WalletConnectConnectedAppsScreen}
      />
      <walletConnectFlowNavigator.Screen name={WALLETCONNECT_BROWSER} component={WalletConnectBrowser} />
    </walletConnectFlowNavigator.Navigator>
  );
}

// HOME FLOW
const homeFlowNavigator = createNativeStackNavigator();
function HomeFlow() {
  return (
    <homeFlowNavigator.Navigator screenOptions={StackNavigatorConfig}>
      <homeFlowNavigator.Screen name={HOME} component={HomeScreen} />
      <homeFlowNavigator.Screen name={ADD_TOKENS} component={AddTokensScreen} />
      <homeFlowNavigator.Screen name={TOKENS_WITH_TOGGLES} component={TokenWithToggles} />
      <homeFlowNavigator.Screen name={MANAGE_TOKEN_LISTS} component={ManageTokenLists} />
      {/* <homeFlowNavigator.Screen name={STORYBOOK} component={StorybookScreen} /> */}
      <homeFlowNavigator.Screen name={SEND_TOKEN_PIN_CONFIRM} component={SendTokenPinConfirmScreen} />
      <homeFlowNavigator.Screen name={SEND_TOKEN_TRANSACTION} component={SendTokenTransactionScreen} />
    </homeFlowNavigator.Navigator>
  );
}

// SEND TOKEN FLOW
const sendTokenFlowNavigator = createNativeStackNavigator();
function SendTokenFlow() {
  return (
    <sendTokenFlowNavigator.Navigator screenOptions={StackNavigatorModalConfig}>
      <sendTokenFlowNavigator.Screen name={SEND_COLLECTIBLE_CONFIRM} component={SendCollectibleConfirmScreen} />
      <sendTokenFlowNavigator.Screen name={SEND_TOKEN_CONFIRM} component={SendTokenConfirmScreen} />
      <sendTokenFlowNavigator.Screen name={SEND_TOKEN_PIN_CONFIRM} component={SendTokenPinConfirmScreen} />
      <sendTokenFlowNavigator.Screen name={SEND_TOKEN_TRANSACTION} component={SendTokenTransactionScreen} />
    </sendTokenFlowNavigator.Navigator>
  );
}

const changePinFlowNavigator = createNativeStackNavigator();
function ChangePinFlow() {
  return (
    <changePinFlowNavigator.Navigator screenOptions={StackNavigatorModalConfig}>
      <changePinFlowNavigator.Screen name={CHANGE_PIN_CURRENT_PIN} component={ChangePinCurrentPinScreen} />
      <changePinFlowNavigator.Screen name={CHANGE_PIN_NEW_PIN} component={ChangePinNewPinScreen} />
      <changePinFlowNavigator.Screen name={CHANGE_PIN_CONFIRM_NEW_PIN} component={ChangePinConfirmNewPinScreen} />
    </changePinFlowNavigator.Navigator>
  );
}

// WALLET BACKUP IN SETTINGS FLOW
const backupWalletFlowNavigator = createNativeStackNavigator();
function BackupWalletFlow() {
  return (
    <backupWalletFlowNavigator.Navigator screenOptions={StackNavigatorModalConfig}>
      <backupWalletFlowNavigator.Screen name={BACKUP_WALLET_INTRO} component={BackupWalletIntro} />
      <backupWalletFlowNavigator.Screen name={BACKUP_PHRASE_VALIDATE} component={BackupPhraseValidateScreen} />
    </backupWalletFlowNavigator.Navigator>
  );
}

// TUTORIAL FLOW
const tutorialFlowNavigator = createNativeStackNavigator();
function TutorialFlow() {
  return (
    <tutorialFlowNavigator.Navigator screenOptions={StackNavigatorConfig}>
      <tutorialFlowNavigator.Screen name={TUTORIAL} component={TutorialScreen} />
    </tutorialFlowNavigator.Navigator>
  );
}

// PPN SEND SYNTHETIC ASSET FULL FLOW
const ppnSendSyntheticAssetFlowNavigator = createNativeStackNavigator();
function PpnSendSyntheticAssetFlow() {
  return (
    <ppnSendSyntheticAssetFlowNavigator.Navigator screenOptions={StackNavigatorModalConfig}>
      <ppnSendSyntheticAssetFlowNavigator.Screen name={SEND_TOKEN_PIN_CONFIRM} component={SendTokenPinConfirmScreen} />
      <ppnSendSyntheticAssetFlowNavigator.Screen name={SEND_TOKEN_TRANSACTION} component={SendTokenTransactionScreen} />
      <ppnSendSyntheticAssetFlowNavigator.Screen name={SEND_TOKEN_CONFIRM} component={SendTokenConfirmScreen} />
      <ppnSendSyntheticAssetFlowNavigator.Screen name={SEND_TOKEN_PIN_CONFIRM} component={SendTokenPinConfirmScreen} />
    </ppnSendSyntheticAssetFlowNavigator.Navigator>
  );
}

// MANAGE WALLETS FLOW
const manageWalletsFlowNavigator = createNativeStackNavigator();
function ManageWalletsFlow() {
  return (
    <manageWalletsFlowNavigator.Navigator screenOptions={StackNavigatorConfig}>
      <manageWalletsFlowNavigator.Screen name={ACCOUNTS} component={AccountsScreen} />
    </manageWalletsFlowNavigator.Navigator>
  );
}

const menuFlowNavigator = createNativeStackNavigator();
function MenuFlow() {
  return (
    <menuFlowNavigator.Navigator screenOptions={StackNavigatorConfig}>
      <menuFlowNavigator.Screen name={MENU} component={MenuScreen} />
      <menuFlowNavigator.Screen name={MENU_SETTINGS} component={MenuSettingsScreen} />
      <menuFlowNavigator.Screen name={MANAGE_TOKEN_LISTS} component={ManageTokenLists} />
      <menuFlowNavigator.Screen name={MENU_SELECT_LANGUAGE} component={MenuSelectLanguageScreen} />
      <menuFlowNavigator.Screen name={MENU_SELECT_APPEARANCE} component={MenuSelectAppearanceScreen} />
      <menuFlowNavigator.Screen name={MENU_SELECT_CURRENCY} component={MenuSelectCurrencyScreen} />
      <menuFlowNavigator.Screen name={IMPORT_WALLET} component={ImportWalletScreen} />
      <menuFlowNavigator.Screen name={WELCOME_BACK} component={WelcomeBackScreen} />
      <menuFlowNavigator.Screen name={SET_WALLET_PIN_CODE} component={SetWalletPinCodeScreen} />
      <menuFlowNavigator.Screen name={PIN_CODE_CONFIRMATION} component={PinCodeConfirmationScreen} />
    </menuFlowNavigator.Navigator>
  );
}

const importFlowFromSettingsNavigator = createNativeStackNavigator();
function ImportFlowFromSettings() {
  return (
    <importFlowFromSettingsNavigator.Navigator screenOptions={StackNavigatorConfig}>
      <importFlowFromSettingsNavigator.Screen name={IMPORT_WALLET} component={ImportWalletScreen} />
      <importFlowFromSettingsNavigator.Screen name={WELCOME_BACK} component={WelcomeBackScreen} />
      <importFlowFromSettingsNavigator.Screen name={SET_WALLET_PIN_CODE} component={SetWalletPinCodeScreen} />
      <importFlowFromSettingsNavigator.Screen name={PIN_CODE_CONFIRMATION} component={PinCodeConfirmationScreen} />
    </importFlowFromSettingsNavigator.Navigator>
  );
}

const contactsFlowNavigator = createNativeStackNavigator();
function ContactsFlow() {
  return (
    <contactsFlowNavigator.Navigator screenOptions={StackNavigatorConfig}>
      <contactsFlowNavigator.Screen name={CONTACTS_LIST} component={ContactsListScreen} />
    </contactsFlowNavigator.Navigator>
  );
}

const ensMigrationFlowNavigator = createNativeStackNavigator();
function EnsMigrationFlow() {
  return (
    <ensMigrationFlowNavigator.Navigator screenOptions={StackNavigatorConfig}>
      <ensMigrationFlowNavigator.Screen name={SEND_TOKEN_TRANSACTION} component={SendTokenTransactionScreen} />
    </ensMigrationFlowNavigator.Navigator>
  );
}

// Below screens/flows will appear as modals
const AppFlowStackNavigator = createNativeStackNavigator();
function AppFlowNavigation() {
  return (
    <AppFlowStackNavigator.Navigator screenOptions={modalTransition}>
      <AppFlowStackNavigator.Screen name={HOME_FLOW} component={HomeFlow} />
      <AppFlowStackNavigator.Screen name={ASSETS} component={AssetsFlow} />
      <AppFlowStackNavigator.Screen name={SEND_TOKEN_FROM_HOME_FLOW} component={SendTokenFlow} />
      <AppFlowStackNavigator.Screen name={CONNECT_FLOW} component={WalletConnectFlow} />
      <AppFlowStackNavigator.Screen name={SEND_TOKEN_FROM_ASSET_FLOW} component={SendTokenFlow} />
      <AppFlowStackNavigator.Screen name={PPN_SEND_SYNTHETIC_ASSET_FLOW} component={PpnSendSyntheticAssetFlow} />
      <AppFlowStackNavigator.Screen name={SEND_TOKEN_FROM_CONTACT_FLOW} component={SendTokenFlow} />
      <AppFlowStackNavigator.Screen name={SEND_COLLECTIBLE_FROM_ASSET_FLOW} component={SendTokenFlow} />
      <AppFlowStackNavigator.Screen name={CHANGE_PIN_FLOW} component={ChangePinFlow} />
      <AppFlowStackNavigator.Screen name={REVEAL_BACKUP_PHRASE} component={RevealBackupPhraseScreen} />
      <AppFlowStackNavigator.Screen name={BACKUP_WALLET_IN_SETTINGS_FLOW} component={BackupWalletFlow} />
      <AppFlowStackNavigator.Screen name={MANAGE_WALLETS_FLOW} component={ManageWalletsFlow} />
      <AppFlowStackNavigator.Screen name={WALLETCONNECT_FLOW} component={WalletConnectFlow} />
      <AppFlowStackNavigator.Screen name={LOGOUT_PENDING} component={LogoutPendingScreen} />
      <AppFlowStackNavigator.Screen name={MENU_FLOW} component={MenuFlow} />
      <AppFlowStackNavigator.Screen name={PIN_CODE} component={PinCodeUnlockScreen} />
      <AppFlowStackNavigator.Screen name={CONTACTS_FLOW} component={ContactsFlow} />
      <AppFlowStackNavigator.Screen name={EXCHANGE_FLOW} component={ExchangeFlow} />
      <AppFlowStackNavigator.Screen name={TUTORIAL_FLOW} component={TutorialFlow} />
      <AppFlowStackNavigator.Screen
        name={WALLETCONNECT_CONNECTOR_REQUEST_SCREEN}
        component={WalletConnectConnectorRequestScreen}
      />
      <AppFlowStackNavigator.Screen
        name={WALLETCONNECT_CALL_REQUEST_SCREEN}
        component={WalletConnectCallRequestScreen}
      />
      <AppFlowStackNavigator.Screen name={WALLETCONNECT_CALL_REQUEST_FLOW} component={WalletConnectCallRequestFlow} />
      <AppFlowStackNavigator.Screen
        name={ETHERSPOT_DEPLOYMENT_INTERJECTION}
        component={EtherspotDeploymentInterjection}
      />
      <AppFlowStackNavigator.Screen name={ENS_MIGRATION_FLOW} component={EnsMigrationFlow} />
      <AppFlowStackNavigator.Screen name={WEB_VIEW} component={WebViewScreen} />
      <AppFlowStackNavigator.Screen name={LEGAL_SCREEN} component={LegalScreen} />
      <AppFlowStackNavigator.Screen name={IMPORT_FLOW_FROM_SETTINGS} component={ImportFlowFromSettings} />
    </AppFlowStackNavigator.Navigator>
  );
}

type Props = {
  fetchAppSettingsAndRedirect: Function,
  startListeningNotifications: Function,
  stopListeningNotifications: Function,
  initWalletConnectSessions: (resetExisting: boolean) => void,
  notifications: Notification[],
  showHomeUpdateIndicator: boolean,
  navigation: NavigationScreenProp<*>,
  wallet: ?EthereumWallet,
  backupStatus: BackupStatus,
  isPickingImage: boolean,
  removePrivateKeyFromMemory: Function,
  isBrowsingWebView: boolean,
  isOnline: boolean,
  endWalkthrough: () => void,
  theme: Theme,
  handleSystemDefaultThemeChange: () => void,
  i18n: I18n,
  onboardingUsernameRegistrationFailed: boolean,
  handleSystemLanguageChange: () => void,
};

type State = {
  lastAppState: ?string,
};

let lockTimer;

class AppFlow extends React.Component<Props, State> {
  appStateSubscriptions;
  state = {
    lastAppState: AppState.currentState,
  };

  componentDidMount() {
    const { startListeningNotifications, initWalletConnectSessions } = this.props;

    startListeningNotifications();
    this.appStateSubscriptions = addAppStateChangeListener(this.handleAppStateChange);

    initWalletConnectSessions(true);
  }

  componentDidUpdate(prevProps: Props) {
    const { notifications } = this.props;
    const { notifications: prevNotifications } = prevProps;

    notifications
      .slice(prevNotifications.length)
      // $FlowFixMe: flow update to 0.122
      .forEach((notification) => Toast.show({ ...notification }));
  }

  componentWillUnmount() {
    const { stopListeningNotifications } = this.props;

    stopListeningNotifications();
    if (this.appStateSubscriptions) this.appStateSubscriptions.remove();
  }

  handleAppStateChange = (nextAppState: string) => {
    const {
      stopListeningNotifications,
      isPickingImage,
      isBrowsingWebView,
      endWalkthrough,
      handleSystemDefaultThemeChange,
      handleSystemLanguageChange,
      initWalletConnectSessions,
    } = this.props;
    const { lastAppState } = this.state;
    BackgroundTimer.clearTimeout(lockTimer);
    if (isPickingImage || isBrowsingWebView) return;
    // only checking if background state for logout or websocket channel close
    if (APP_LOGOUT_STATES.includes(nextAppState)) {
      // close walkthrough shade or tooltips
      endWalkthrough();
      lockTimer = BackgroundTimer.setTimeout(() => {
        stopListeningNotifications();
      }, SLEEP_TIMEOUT);
    } else if (APP_LOGOUT_STATES.includes(lastAppState) && nextAppState === ACTIVE_APP_STATE) {
      setLastRouteState();
      handleSystemDefaultThemeChange();
      handleSystemLanguageChange();
      initWalletConnectSessions(false);
    }
    this.setState({ lastAppState: nextAppState });
  };

  render() {
    const { showHomeUpdateIndicator, navigation, backupStatus, theme, i18n, onboardingUsernameRegistrationFailed } =
      this.props;

    if (onboardingUsernameRegistrationFailed) return <UsernameFailed />;

    const { isImported, isBackedUp } = backupStatus;
    const isWalletBackedUp = isImported || isBackedUp;

    return (
      <MemoizedAppFlowNavigation
        showHomeUpdateIndicator={showHomeUpdateIndicator}
        isWalletBackedUp={isWalletBackedUp}
        theme={theme}
        language={i18n.language}
        navigation={navigation}
      />
    );
  }
}

// Workaround for React Navigation 4 obscure crash occuring if `screenProps` object is re-created on each render.
// Functional component created just to use useMemo hook, can be inlined when AppFlow is migrated to FC.
const MemoizedAppFlowNavigation = ({ showHomeUpdateIndicator, isWalletBackedUp, theme, language, navigation }) => {
  const screenProps = React.useMemo(
    () => ({
      showHomeUpdateIndicator,
      isWalletBackedUp,
      theme,
      language,
    }),
    [showHomeUpdateIndicator, isWalletBackedUp, theme, language],
  );

  return <AppFlowNavigation screenProps={screenProps} navigation={navigation} />;
};

const mapStateToProps = ({
  notifications: { data: notifications, showHomeUpdateIndicator },
  wallet: { data: wallet, backupStatus },
  appSettings: {
    data: { isPickingImage, isBrowsingWebView },
  },
  session: {
    data: { isOnline },
  },
  onboarding: { usernameRegistrationFailed: onboardingUsernameRegistrationFailed },
}: RootReducerState): $Shape<Props> => ({
  notifications,
  showHomeUpdateIndicator,
  wallet,
  backupStatus,
  isPickingImage,
  isBrowsingWebView,
  isOnline,
  onboardingUsernameRegistrationFailed,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  stopListeningNotifications: () => dispatch(stopListeningNotificationsAction()),
  startListeningNotifications: () => dispatch(startListeningNotificationsAction()),
  initWalletConnectSessions: (resetExisting: boolean) => dispatch(initWalletConnectSessionsAction(resetExisting)),
  removePrivateKeyFromMemory: () => dispatch(removePrivateKeyFromMemoryAction()),
  endWalkthrough: () => dispatch(endWalkthroughAction()),
  handleSystemDefaultThemeChange: () => dispatch(handleSystemDefaultThemeChangeAction()),
  handleSystemLanguageChange: () => dispatch(handleSystemLanguageChangeAction()),
});

const ConnectedAppFlow = withTranslation()(connect(mapStateToProps, mapDispatchToProps)(AppFlow));
ConnectedAppFlow.router = AppFlowNavigation.router;
ConnectedAppFlow.defaultNavigationOptions = AppFlowNavigation.defaultNavigationOptions;

export default withTheme(ConnectedAppFlow);
