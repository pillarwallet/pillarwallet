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
import { createStackNavigator, CardStyleInterpolators } from 'react-navigation-stack';
import type { NavigationScreenProp } from 'react-navigation';
import BackgroundTimer from 'react-native-background-timer';
import { connect } from 'react-redux';
import { AppState } from 'react-native';
import { withTheme } from 'styled-components/native';
import { withTranslation } from 'react-i18next';

// screens
import AssetsScreen from 'screens/Assets';
import AssetScreen from 'screens/Asset';
import ExchangeScreen from 'screens/Exchange/Exchange';
import ExchangeConfirmScreen from 'screens/Exchange/ExchangeConfirm';
import ChangePinCurrentPinScreen from 'screens/ChangePin/CurrentPin';
import ChangePinNewPinScreen from 'screens/ChangePin/NewPin';
import ChangePinConfirmNewPinScreen from 'screens/ChangePin/ConfirmNewPin';
import RevealBackupPhraseScreen from 'screens/RevealBackupPhrase';
import SendTokenAmountScreen from 'screens/SendToken/SendTokenAmount';
import SendTokenPinConfirmScreen from 'screens/SendToken/SendTokenPinConfirmScreen';
import SendTokenConfirmScreen from 'screens/SendToken/SendTokenConfirm';
import SendTokenTransactionScreen from 'screens/SendToken/SendTokenTransaction';
import SendCollectibleConfirmScreen from 'screens/SendCollectible/SendCollectibleConfirm';
import PPNSendTokenAmountScreen from 'screens/Tank/SendToken/PPNSendTokenAmount';
import HistoryScreen from 'screens/History';
import HomeScreen from 'screens/Home';
import CollectibleScreen from 'screens/Collectible';
import WalletConnectHomeScreen from 'screens/WalletConnect/Home';
import WalletConnectConnectedAppsScreen from 'screens/WalletConnect/ConnectedApps';
import WalletConnectConnectorRequestScreen from 'screens/WalletConnect/WalletConnectConnectorRequest';
import WalletConnectCallRequestScreen from 'screens/WalletConnect/CallRequest/WalletConnectCallRequestScreen';
import WalletConnectPinConfirm from 'screens/WalletConnect/WalletConnectPinConfirm';
import EtherspotDeploymentInterjection from 'screens/EtherspotDeploymentInterjection';
import FundTankScreen from 'screens/Tank/FundTank';
import FundConfirmScreen from 'screens/Tank/FundConfirm';
import SettleBalanceScreen from 'screens/Tank/SettleBalance';
import SettleBalanceConfirmScreen from 'screens/Tank/SettleBalanceConfirm';
import TankWithdrawalScreen from 'screens/Tank/TankWithdrawal';
import TankWithdrawalConfirmScreen from 'screens/Tank/TankWithdrawalConfirm';
import AccountsScreen from 'screens/Accounts';
import PillarNetworkIntro from 'screens/PillarNetwork/PillarNetworkIntro';
import UnsettledAssetsScreen from 'screens/UnsettledAssets';
import SendSyntheticAmountScreen from 'screens/SendSynthetic/SendSyntheticAmount';
import LogoutPendingScreen from 'screens/LogoutPending';
import PPNHomeScreen from 'screens/PPNHome/PPNHome';
import ServicesScreen from 'screens/Services';
import StorybookScreen from 'screens/Storybook';
import MenuScreen from 'screens/Menu/Menu';
import MenuSettingsScreen from 'screens/Menu/Settings';
import MenuSelectLanguageScreen from 'screens/Menu/SelectLanguage';
import MenuSelectCurrencyScreen from 'screens/Menu/SelectCurrency';
import MenuSystemInformationScreen from 'screens/Menu/SystemInformation';
import WebViewScreen from 'screens/WebView/WebViewScreen';
import PinCodeUnlockScreen from 'screens/PinCodeUnlock';
import WalletActivatedScreen from 'screens/WalletActivated';
import WalletMigrationArchanovaIntroScreen from 'screens/WalletMigrationArchanova/Intro';
import WalletMigrationArchanovaStatusScreen from 'screens/WalletMigrationArchanova/Status';
import WalletMigrationArchanovaSelectAssetsScreen from 'screens/WalletMigrationArchanova/SelectAssets';
import WalletMigrationArchanovaSetAmountScreen from 'screens/WalletMigrationArchanova/SetAmount';
import WalletMigrationArchanovaReviewScreen from 'screens/WalletMigrationArchanova/Review';
import WalletMigrationArchanovaPinConfirmScreen from 'screens/WalletMigrationArchanova/PinConfirm';
import KeyBasedAssetTransferIntroScreen from 'screens/KeyBasedAssetTransfer/KeyBasedAssetTransferIntro';
import KeyBasedAssetTransferChooseScreen from 'screens/KeyBasedAssetTransfer/KeyBasedAssetTransferChoose';
import KeyBasedAssetTransferEditAmountScreen from 'screens/KeyBasedAssetTransfer/KeyBasedAssetTransferEditAmount';
import KeyBasedAssetTransferConfirmScreen from 'screens/KeyBasedAssetTransfer/KeyBasedAssetTransferConfirm';
import KeyBasedAssetTransferUnlockScreen from 'screens/KeyBasedAssetTransfer/KeyBasedAssetTransferUnlock';
import KeyBasedAssetTransferStatusScreen from 'screens/KeyBasedAssetTransfer/KeyBasedAssetTransferStatus';
import ContactsListScreen from 'screens/Contacts/ContactsList';
import LiquidityPoolDashboardScreen from 'screens/LiquidityPools/LiquidityPoolDashboard';
import LiquidityPoolsAddLiquidityScreen from 'screens/LiquidityPools/AddLiquidity';
import LiquidityPoolsAddLiquidityReviewScreen from 'screens/LiquidityPools/AddLiquidityReview';
import LiquidityPoolsStakeTokensScreen from 'screens/LiquidityPools/StakeTokens';
import LiquidityPoolsStakeTokensReviewScreen from 'screens/LiquidityPools/StakeTokensReview';
import LiquidityPoolsUnstakeTokensScreen from 'screens/LiquidityPools/UnstakeTokens';
import LiquidityPoolsUnstakeTokensReviewScreen from 'screens/LiquidityPools/UnstakeTokensReview';
import LiquidityPoolsRemoveLiquidityScreen from 'screens/LiquidityPools/RemoveLiquidity';
import LiquidityPoolsRemoveLiquidityReviewScreen from 'screens/LiquidityPools/RemoveLiquidityReview';
import LiquidityPoolsClaimRewardsReviewScreen from 'screens/LiquidityPools/ClaimRewardsReview';
import LiquidityPoolsScreen from 'screens/LiquidityPools/LiquidityPools';
import LiquidityPoolsInfoScreen from 'screens/LiquidityPools/LiquidityPoolsInfo';
import TutorialScreen from 'screens/Tutorial';
import EnsMigrationConfirmScreen from 'screens/EnsMigrationConfirm';
import AddCashScreen from 'screens/AddCash/AddCash';
import LegalScreen from 'screens/LegalScreen/LegalScreen';
import BackupWalletIntro from 'screens/BackupWallet/Intro';
import BackupPhraseValidateScreen from 'screens/BackupWallet/BackupPhraseValidate';
import WelcomeBackScreen from 'screens/WelcomeBack';
import ImportWalletScreen from 'screens/ImportWallet';
import SetWalletPinCodeScreen from 'screens/SetWalletPinCode';
import PinCodeConfirmationScreen from 'screens/PinCodeConfirmation';
import WalletConnectBrowser from 'screens/WalletConnect/WalletConnectBrowser';
import RegisterENSScreen from 'screens/RegisterENS';
import NIServices from 'screens/NativeIntegration/NIServices';
import NIInputService from 'screens/NativeIntegration/NIInputService';
import NIViewService from 'screens/NativeIntegration/NIViewService';
import NITransactionSubmitted from 'screens/NativeIntegration/NITransactionSubmitted';
import NIWarningScreen from 'screens/NativeIntegration/NIWarning';

// components
import Toast from 'components/Toast';
import UsernameFailed from 'components/UsernameFailed';

// actions
import { stopListeningNotificationsAction, startListeningNotificationsAction } from 'actions/notificationsActions';
import { removePrivateKeyFromMemoryAction } from 'actions/walletActions';
import { endWalkthroughAction } from 'actions/walkthroughsActions';
import { handleSystemDefaultThemeChangeAction } from 'actions/appSettingsActions';
import { handleSystemLanguageChangeAction } from 'actions/sessionActions';
import { checkArchanovaSessionIfNeededAction } from 'actions/smartWalletActions';
import { initWalletConnectSessionsAction } from 'actions/walletConnectSessionsActions';

// constants
import {
  MAIN_FLOW,
  ASSETS,
  ASSET,
  SERVICES_FLOW,
  EXCHANGE,
  EXCHANGE_CONFIRM,
  HOME,
  HOME_FLOW,
  HOME_HISTORY,
  ETHERSPOT_DEPLOYMENT_INTERJECTION,
  CHANGE_PIN_FLOW,
  CHANGE_PIN_CURRENT_PIN,
  CHANGE_PIN_NEW_PIN,
  CHANGE_PIN_CONFIRM_NEW_PIN,
  SEND_TOKEN_AMOUNT,
  SEND_TOKEN_CONFIRM,
  SEND_TOKEN_TRANSACTION,
  SEND_TOKEN_FROM_ASSET_FLOW,
  SEND_TOKEN_FROM_CONTACT_FLOW,
  SEND_TOKEN_PIN_CONFIRM,
  REVEAL_BACKUP_PHRASE,
  BACKUP_WALLET_INTRO,
  BACKUP_PHRASE_VALIDATE,
  BACKUP_WALLET_IN_SETTINGS_FLOW,
  COLLECTIBLE,
  SEND_COLLECTIBLE_FROM_ASSET_FLOW,
  SEND_COLLECTIBLE_CONFIRM,
  WALLETCONNECT_FLOW,
  WALLETCONNECT,
  WALLETCONNECT_CONNECTED_APPS,
  WALLETCONNECT_CONNECTOR_REQUEST_SCREEN,
  WALLETCONNECT_CALL_REQUEST_SCREEN,
  WALLETCONNECT_PIN_CONFIRM_SCREEN,
  WALLETCONNECT_BROWSER,
  TANK_SETTLE_FLOW,
  TANK_FUND_FLOW,
  FUND_TANK,
  FUND_CONFIRM,
  SETTLE_BALANCE,
  SETTLE_BALANCE_CONFIRM,
  MANAGE_WALLETS_FLOW,
  ACCOUNTS,
  PILLAR_NETWORK_INTRO,
  MENU_FLOW,
  MENU,
  MENU_SETTINGS,
  MENU_SELECT_LANGUAGE,
  MENU_SELECT_CURRENCY,
  MENU_SYSTEM_INFORMATION,
  PPN_SEND_TOKEN_AMOUNT,
  PPN_SEND_TOKEN_FROM_ASSET_FLOW,
  PPN_SEND_SYNTHETIC_ASSET_FLOW,
  UNSETTLED_ASSETS,
  TANK_WITHDRAWAL_FLOW,
  TANK_WITHDRAWAL,
  TANK_WITHDRAWAL_CONFIRM,
  SEND_SYNTHETIC_AMOUNT,
  LOGOUT_PENDING,
  UNSETTLED_ASSETS_FLOW,
  SERVICES,
  PPN_HOME,
  STORYBOOK,
  CONNECT_FLOW,
  SEND_TOKEN_FROM_HOME_FLOW,
  PIN_CODE,
  WALLET_ACTIVATED,
  KEY_BASED_ASSET_TRANSFER_INTRO,
  KEY_BASED_ASSET_TRANSFER_CHOOSE,
  KEY_BASED_ASSET_TRANSFER_EDIT_AMOUNT,
  KEY_BASED_ASSET_TRANSFER_CONFIRM,
  KEY_BASED_ASSET_TRANSFER_UNLOCK,
  KEY_BASED_ASSET_TRANSFER_FLOW,
  KEY_BASED_ASSET_TRANSFER_STATUS,
  WALLET_MIGRATION_ARCHANOVA_FLOW,
  WALLET_MIGRATION_ARCHANOVA_INTRO,
  WALLET_MIGRATION_ARCHANOVA_STATUS,
  WALLET_MIGRATION_ARCHANOVA_SELECT_ASSETS,
  WALLET_MIGRATION_ARCHANOVA_SET_AMOUNT,
  WALLET_MIGRATION_ARCHANOVA_REVIEW,
  WALLET_MIGRATION_ARCHANOVA_PIN_CONFIRM,
  CONTACTS_LIST,
  CONTACTS_FLOW,
  EXCHANGE_FLOW,
  WALLETCONNECT_CALL_REQUEST_FLOW,
  LIQUIDITY_POOLS_FLOW,
  LIQUIDITY_POOLS,
  LIQUIDITY_POOL_DASHBOARD,
  LIQUIDITY_POOLS_ADD_LIQUIDITY,
  LIQUIDITY_POOLS_ADD_LIQUIDITY_REVIEW,
  LIQUIDITY_POOLS_STAKE,
  LIQUIDITY_POOLS_STAKE_REVIEW,
  LIQUIDITY_POOLS_UNSTAKE,
  LIQUIDITY_POOLS_UNSTAKE_REVIEW,
  LIQUIDITY_POOLS_REMOVE_LIQUIDITY,
  LIQUIDITY_POOLS_REMOVE_LIQUIDITY_REVIEW,
  LIQUIDITY_POOLS_CLAIM_REWARDS_REVIEW,
  LIQUIDITY_POOLS_INFO,
  TUTORIAL,
  TUTORIAL_FLOW,
  ENS_MIGRATION_CONFIRM,
  WEB_VIEW,
  ENS_MIGRATION_FLOW,
  ADD_CASH,
  LEGAL_SCREEN,
  SET_WALLET_PIN_CODE,
  WELCOME_BACK,
  IMPORT_WALLET,
  PIN_CODE_CONFIRMATION,
  IMPORT_FLOW_FROM_SETTINGS,
  REGISTER_ENS,
  NI_SERVICES,
  NI_VIEW_SERVICE,
  NI_INPUT_SERVICE,
  NI_WARNING,
  NATIVE_INTEGRATION_FLOW,
  NI_TRANSACTION_COMPLETED,
} from 'constants/navigationConstants';
import { DARK_THEME } from 'constants/appSettingsConstants';

// utils
import { modalTransition, addAppStateChangeListener, removeAppStateChangeListener } from 'utils/common';
import { getThemeByType, getThemeColors } from 'utils/themes';

// types
import type { Theme } from 'models/Theme';
import type { I18n } from 'models/Translations';
import type { Notification } from 'models/Notification';
import type { EthereumWallet } from 'models/Wallet';
import type { BackupStatus } from 'reducers/walletReducer';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

const SLEEP_TIMEOUT = 20000;
const SMART_WALLET_SESSION_CHECK_INTERVAL = 30 * 60000; // 30 min
const ACTIVE_APP_STATE = 'active';
const BACKGROUND_APP_STATE = 'background';
const APP_LOGOUT_STATES = [BACKGROUND_APP_STATE];

const StackNavigatorModalConfig = {
  defaultNavigationOptions: {
    headerShown: false,
    cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
  },
};

const StackNavigatorConfig = {
  defaultNavigationOptions: {
    headerShown: false,
    gestureEnabled: true,
    cardStyle: {
      backgroundColor: {
        dark: getThemeColors(getThemeByType(DARK_THEME)).basic070,
        light: getThemeColors(getThemeByType()).basic070,
      },
    },
  },
};

// ASSETS FLOW
const assetsFlow = createStackNavigator(
  {
    [ASSETS]: AssetsScreen,
    [ASSET]: AssetScreen,
    [COLLECTIBLE]: CollectibleScreen,
  },
  StackNavigatorConfig,
);

const exchangeFlow = createStackNavigator(
  {
    [EXCHANGE]: ExchangeScreen,
    [EXCHANGE_CONFIRM]: ExchangeConfirmScreen,
    [SEND_TOKEN_PIN_CONFIRM]: SendTokenPinConfirmScreen,
    [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
  },
  StackNavigatorConfig,
);

// SERVICES FLOW
const servicesFlow = createStackNavigator(
  {
    [SERVICES]: ServicesScreen,
  },
  StackNavigatorConfig,
);

// ADD CASH FLOW
const addCashFlow = createStackNavigator(
  {
    [ADD_CASH]: AddCashScreen,
  },
  StackNavigatorConfig,
);

// WALLETCONNECT CALL REQUEST FLOW
const walletConnectCallRequestFlow = createStackNavigator(
  {
    [WALLETCONNECT_PIN_CONFIRM_SCREEN]: WalletConnectPinConfirm,
    [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
  },
  StackNavigatorConfig,
);

// WALLETCONNECT FLOW
const walletConnectFlow = createStackNavigator(
  {
    [WALLETCONNECT]: WalletConnectHomeScreen,
    [WALLETCONNECT_CONNECTED_APPS]: WalletConnectConnectedAppsScreen,
    [WALLETCONNECT_BROWSER]: WalletConnectBrowser,
  },
  StackNavigatorConfig,
);

// NATIVE INTEGRATION FLOW
const nativeIntegrationFlow = createStackNavigator(
  {
    [NI_WARNING]: NIWarningScreen,
    [NI_SERVICES]: NIServices,
    [NI_INPUT_SERVICE]: NIInputService,
    [NI_VIEW_SERVICE]: NIViewService,
    [NI_TRANSACTION_COMPLETED]: NITransactionSubmitted,
  },
  StackNavigatorConfig,
);

// HOME FLOW
const homeFlow = createStackNavigator(
  {
    [HOME]: HomeScreen,
    [HOME_HISTORY]: HistoryScreen,
    [COLLECTIBLE]: CollectibleScreen,
    [STORYBOOK]: StorybookScreen,
    [SEND_TOKEN_AMOUNT]: SendTokenAmountScreen,
    [SEND_TOKEN_PIN_CONFIRM]: SendTokenPinConfirmScreen,
    [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
    [REGISTER_ENS]: RegisterENSScreen,
  },
  StackNavigatorConfig,
);

// SEND TOKEN FLOW
const sendTokenFlow = createStackNavigator(
  {
    [SEND_TOKEN_AMOUNT]: SendTokenAmountScreen,
    [SEND_COLLECTIBLE_CONFIRM]: SendCollectibleConfirmScreen,
    [SEND_TOKEN_CONFIRM]: SendTokenConfirmScreen,
    [SEND_TOKEN_PIN_CONFIRM]: SendTokenPinConfirmScreen,
    [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
  },
  StackNavigatorModalConfig,
);

const changePinFlow = createStackNavigator(
  {
    [CHANGE_PIN_CURRENT_PIN]: ChangePinCurrentPinScreen,
    [CHANGE_PIN_NEW_PIN]: ChangePinNewPinScreen,
    [CHANGE_PIN_CONFIRM_NEW_PIN]: ChangePinConfirmNewPinScreen,
  },
  StackNavigatorModalConfig,
);

// WALLET BACKUP IN SETTINGS FLOW
const backupWalletFlow = createStackNavigator(
  {
    [BACKUP_WALLET_INTRO]: BackupWalletIntro,
    [BACKUP_PHRASE_VALIDATE]: BackupPhraseValidateScreen,
  },
  StackNavigatorModalConfig,
);

// TUTORIAL FLOW
const tutorialFlow = createStackNavigator(
  {
    [TUTORIAL]: TutorialScreen,
  },
  StackNavigatorConfig,
);

// PPN SEND TOKEN FROM ASSET FLOW
const ppnSendTokenFromAssetFlow = createStackNavigator(
  {
    [PPN_SEND_TOKEN_AMOUNT]: PPNSendTokenAmountScreen,
  },
  StackNavigatorModalConfig,
);

// PPN SEND SYNTHETIC ASSET FULL FLOW
const ppnSendSyntheticAssetFlow = createStackNavigator(
  {
    // synthetic
    [SEND_SYNTHETIC_AMOUNT]: SendSyntheticAmountScreen,
    [SEND_TOKEN_PIN_CONFIRM]: SendTokenPinConfirmScreen,
    [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
    // other
    [SEND_TOKEN_AMOUNT]: SendTokenAmountScreen,
    [SEND_TOKEN_CONFIRM]: SendTokenConfirmScreen,
    [SEND_TOKEN_PIN_CONFIRM]: SendTokenPinConfirmScreen,
    [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
  },
  StackNavigatorModalConfig,
);

// MANAGE WALLETS FLOW
const manageWalletsFlow = createStackNavigator(
  {
    [ACCOUNTS]: AccountsScreen,
    [FUND_CONFIRM]: FundConfirmScreen,
  },
  StackNavigatorConfig,
);

// TANK FLOWS
const tankSettleFlow = createStackNavigator(
  {
    [SETTLE_BALANCE]: SettleBalanceScreen,
    [SETTLE_BALANCE_CONFIRM]: SettleBalanceConfirmScreen,
  },
  StackNavigatorConfig,
);

// UNSETTLED ASSETS FLOW
const unsettledAssetsFlow = createStackNavigator(
  {
    [UNSETTLED_ASSETS]: UnsettledAssetsScreen,
    [SETTLE_BALANCE]: SettleBalanceScreen,
    [SETTLE_BALANCE_CONFIRM]: SettleBalanceConfirmScreen,
  },
  StackNavigatorConfig,
);

const tankFundFlow = createStackNavigator(
  {
    [FUND_TANK]: FundTankScreen,
    [FUND_CONFIRM]: FundConfirmScreen,
  },
  StackNavigatorConfig,
);

const tankWithdrawalFlow = createStackNavigator(
  {
    [TANK_WITHDRAWAL]: TankWithdrawalScreen,
    [TANK_WITHDRAWAL_CONFIRM]: TankWithdrawalConfirmScreen,
  },
  StackNavigatorConfig,
);

const menuFlow = createStackNavigator(
  {
    [MENU]: MenuScreen,
    [MENU_SETTINGS]: MenuSettingsScreen,
    [MENU_SELECT_LANGUAGE]: MenuSelectLanguageScreen,
    [MENU_SELECT_CURRENCY]: MenuSelectCurrencyScreen,
    [MENU_SYSTEM_INFORMATION]: MenuSystemInformationScreen,
    [IMPORT_WALLET]: ImportWalletScreen,
    [WELCOME_BACK]: WelcomeBackScreen,
    [SET_WALLET_PIN_CODE]: SetWalletPinCodeScreen,
    [PIN_CODE_CONFIRMATION]: PinCodeConfirmationScreen,
  },
  StackNavigatorConfig,
);

const ImportFlowFromSettings = createStackNavigator(
  {
    [IMPORT_WALLET]: ImportWalletScreen,
    [WELCOME_BACK]: WelcomeBackScreen,
    [SET_WALLET_PIN_CODE]: SetWalletPinCodeScreen,
    [PIN_CODE_CONFIRMATION]: PinCodeConfirmationScreen,
  },
  StackNavigatorConfig,
);

const keyBasedAssetTransferFlow = createStackNavigator(
  {
    [KEY_BASED_ASSET_TRANSFER_INTRO]: KeyBasedAssetTransferIntroScreen,
    [KEY_BASED_ASSET_TRANSFER_CHOOSE]: KeyBasedAssetTransferChooseScreen,
    [KEY_BASED_ASSET_TRANSFER_EDIT_AMOUNT]: KeyBasedAssetTransferEditAmountScreen,
    [KEY_BASED_ASSET_TRANSFER_CONFIRM]: KeyBasedAssetTransferConfirmScreen,
    [KEY_BASED_ASSET_TRANSFER_UNLOCK]: KeyBasedAssetTransferUnlockScreen,
    [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
  },
  StackNavigatorConfig,
);

const walletMigrationFlow = createStackNavigator(
  {
    [WALLET_MIGRATION_ARCHANOVA_INTRO]: WalletMigrationArchanovaIntroScreen,
    [WALLET_MIGRATION_ARCHANOVA_SELECT_ASSETS]: WalletMigrationArchanovaSelectAssetsScreen,
    [WALLET_MIGRATION_ARCHANOVA_SET_AMOUNT]: WalletMigrationArchanovaSetAmountScreen,
    [WALLET_MIGRATION_ARCHANOVA_REVIEW]: WalletMigrationArchanovaReviewScreen,
    [WALLET_MIGRATION_ARCHANOVA_PIN_CONFIRM]: WalletMigrationArchanovaPinConfirmScreen,
    [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
  },
  StackNavigatorConfig,
);

const contactsFlow = createStackNavigator(
  {
    [CONTACTS_LIST]: ContactsListScreen,
  },
  StackNavigatorConfig,
);

const ensMigrationFlow = createStackNavigator(
  {
    [ENS_MIGRATION_CONFIRM]: EnsMigrationConfirmScreen,
    [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
  },
  StackNavigatorConfig,
);

const liquidityPoolsFlow = createStackNavigator(
  {
    [LIQUIDITY_POOLS]: LiquidityPoolsScreen,
    [LIQUIDITY_POOL_DASHBOARD]: LiquidityPoolDashboardScreen,
    [LIQUIDITY_POOLS_ADD_LIQUIDITY]: LiquidityPoolsAddLiquidityScreen,
    [LIQUIDITY_POOLS_ADD_LIQUIDITY_REVIEW]: LiquidityPoolsAddLiquidityReviewScreen,
    [LIQUIDITY_POOLS_STAKE]: LiquidityPoolsStakeTokensScreen,
    [LIQUIDITY_POOLS_STAKE_REVIEW]: LiquidityPoolsStakeTokensReviewScreen,
    [LIQUIDITY_POOLS_UNSTAKE]: LiquidityPoolsUnstakeTokensScreen,
    [LIQUIDITY_POOLS_UNSTAKE_REVIEW]: LiquidityPoolsUnstakeTokensReviewScreen,
    [LIQUIDITY_POOLS_REMOVE_LIQUIDITY]: LiquidityPoolsRemoveLiquidityScreen,
    [LIQUIDITY_POOLS_REMOVE_LIQUIDITY_REVIEW]: LiquidityPoolsRemoveLiquidityReviewScreen,
    [LIQUIDITY_POOLS_CLAIM_REWARDS_REVIEW]: LiquidityPoolsClaimRewardsReviewScreen,
    [LIQUIDITY_POOLS_INFO]: LiquidityPoolsInfoScreen,
    [SEND_TOKEN_PIN_CONFIRM]: SendTokenPinConfirmScreen,
    [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
  },
  StackNavigatorConfig,
);

const MainStack = createStackNavigator(
  {
    [HOME_FLOW]: homeFlow,
    [ASSETS]: assetsFlow,
  },
  StackNavigatorConfig,
);

// Below screens/flows will appear as modals
const AppFlowNavigation = createStackNavigator(
  {
    [MAIN_FLOW]: MainStack,
    [SEND_TOKEN_FROM_HOME_FLOW]: sendTokenFlow,
    [CONNECT_FLOW]: walletConnectFlow,
    [SERVICES_FLOW]: servicesFlow,
    [PPN_HOME]: PPNHomeScreen,
    [SEND_TOKEN_FROM_ASSET_FLOW]: sendTokenFlow,
    [PPN_SEND_TOKEN_FROM_ASSET_FLOW]: ppnSendTokenFromAssetFlow,
    [PPN_SEND_SYNTHETIC_ASSET_FLOW]: ppnSendSyntheticAssetFlow,
    [SEND_TOKEN_FROM_CONTACT_FLOW]: sendTokenFlow,
    [SEND_COLLECTIBLE_FROM_ASSET_FLOW]: sendTokenFlow,
    [CHANGE_PIN_FLOW]: changePinFlow,
    [REVEAL_BACKUP_PHRASE]: RevealBackupPhraseScreen,
    [BACKUP_WALLET_IN_SETTINGS_FLOW]: backupWalletFlow,
    [MANAGE_WALLETS_FLOW]: manageWalletsFlow,
    [TANK_SETTLE_FLOW]: tankSettleFlow,
    [UNSETTLED_ASSETS_FLOW]: unsettledAssetsFlow,
    [TANK_FUND_FLOW]: tankFundFlow,
    [TANK_WITHDRAWAL_FLOW]: tankWithdrawalFlow,
    [WALLETCONNECT_FLOW]: walletConnectFlow,
    [PILLAR_NETWORK_INTRO]: PillarNetworkIntro,
    [LOGOUT_PENDING]: LogoutPendingScreen,
    [MENU_FLOW]: menuFlow,
    [PIN_CODE]: PinCodeUnlockScreen,
    [WALLET_ACTIVATED]: WalletActivatedScreen,
    [WALLET_MIGRATION_ARCHANOVA_FLOW]: walletMigrationFlow,
    [WALLET_MIGRATION_ARCHANOVA_STATUS]: WalletMigrationArchanovaStatusScreen,
    [KEY_BASED_ASSET_TRANSFER_FLOW]: keyBasedAssetTransferFlow,
    [KEY_BASED_ASSET_TRANSFER_STATUS]: KeyBasedAssetTransferStatusScreen,
    [CONTACTS_FLOW]: contactsFlow,
    [EXCHANGE_FLOW]: exchangeFlow,
    [LIQUIDITY_POOLS_FLOW]: liquidityPoolsFlow,
    [TUTORIAL_FLOW]: tutorialFlow,
    [WALLETCONNECT_CONNECTOR_REQUEST_SCREEN]: WalletConnectConnectorRequestScreen,
    [WALLETCONNECT_CALL_REQUEST_SCREEN]: WalletConnectCallRequestScreen,
    [WALLETCONNECT_CALL_REQUEST_FLOW]: walletConnectCallRequestFlow,
    [ETHERSPOT_DEPLOYMENT_INTERJECTION]: EtherspotDeploymentInterjection,
    [ENS_MIGRATION_FLOW]: ensMigrationFlow,
    [ADD_CASH]: addCashFlow,
    [WEB_VIEW]: WebViewScreen,
    [LEGAL_SCREEN]: LegalScreen,
    [IMPORT_FLOW_FROM_SETTINGS]: ImportFlowFromSettings,
    [NATIVE_INTEGRATION_FLOW]: nativeIntegrationFlow,
  },
  modalTransition,
);

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
  checkArchanovaSession: () => void,
};

type State = {
  lastAppState: ?string,
};

let lockTimer;
let smartWalletSessionCheckInterval;

class AppFlow extends React.Component<Props, State> {
  state = {
    lastAppState: AppState.currentState,
  };

  componentDidMount() {
    const { startListeningNotifications, initWalletConnectSessions, checkArchanovaSession } = this.props;

    startListeningNotifications();
    addAppStateChangeListener(this.handleAppStateChange);

    smartWalletSessionCheckInterval = BackgroundTimer.setInterval(
      checkArchanovaSession,
      SMART_WALLET_SESSION_CHECK_INTERVAL,
    );

    initWalletConnectSessions(true);
  }

  componentDidUpdate(prevProps: Props) {
    const { notifications, wallet, removePrivateKeyFromMemory } = this.props;
    const { notifications: prevNotifications } = prevProps;

    if (wallet?.privateKey) {
      removePrivateKeyFromMemory();
    }

    notifications
      .slice(prevNotifications.length)
      // $FlowFixMe: flow update to 0.122
      .forEach((notification) => Toast.show({ ...notification }));
  }

  componentWillUnmount() {
    const { stopListeningNotifications } = this.props;

    stopListeningNotifications();
    removeAppStateChangeListener(this.handleAppStateChange);
    BackgroundTimer.clearInterval(smartWalletSessionCheckInterval);
  }

  handleAppStateChange = (nextAppState: string) => {
    const {
      stopListeningNotifications,
      isPickingImage,
      isBrowsingWebView,
      endWalkthrough,
      handleSystemDefaultThemeChange,
      handleSystemLanguageChange,
      checkArchanovaSession,
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
      handleSystemDefaultThemeChange();
      handleSystemLanguageChange();
      checkArchanovaSession();
      initWalletConnectSessions(false);
    }
    this.setState({ lastAppState: nextAppState });
  };

  render() {
    const {
      showHomeUpdateIndicator,
      navigation,
      backupStatus,
      theme,
      i18n,
      onboardingUsernameRegistrationFailed,
    } = this.props;

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
  checkArchanovaSession: () => dispatch(checkArchanovaSessionIfNeededAction()),
});

const ConnectedAppFlow = withTranslation()(connect(mapStateToProps, mapDispatchToProps)(AppFlow));
ConnectedAppFlow.router = AppFlowNavigation.router;
ConnectedAppFlow.defaultNavigationOptions = AppFlowNavigation.defaultNavigationOptions;

export default withTheme(ConnectedAppFlow);
