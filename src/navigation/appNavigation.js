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
import { createStackNavigator } from 'react-navigation';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import type { NavigationScreenProp } from 'react-navigation';
import BackgroundTimer from 'react-native-background-timer';
import { connect } from 'react-redux';
import { Animated, Easing, View, Image, AppState } from 'react-native';
import { withTheme } from 'styled-components';

// services
import { updateNavigationLastScreenState } from 'services/navigation';

// screens
import AssetsScreen from 'screens/Assets';
import AssetScreen from 'screens/Asset';
import ProfileScreen from 'screens/Profile';
import PeopleScreen from 'screens/People';
import ExchangeScreen from 'screens/Exchange';
import ExchangeConfirmScreen from 'screens/Exchange/ExchangeConfirm';
import ExchangeInfoScreen from 'screens/Exchange/ExchangeInfo';
import ExchangeReceiveExplained from 'screens/Exchange/ExchangeReceiveExplained';
import ContactScreen from 'screens/Contact';
import ConnectionRequestsScreen from 'screens/ConnectionRequests';
import ChangePinCurrentPinScreen from 'screens/ChangePin/CurrentPin';
import ChangePinNewPinScreen from 'screens/ChangePin/NewPin';
import ChangePinConfirmNewPinScreen from 'screens/ChangePin/ConfirmNewPin';
import RevealBackupPhraseScreen from 'screens/RevealBackupPhrase';
import SendTokenAmountScreen from 'screens/SendToken/SendTokenAmount';
import SendTokenContactsScreen from 'screens/SendToken/SendTokenContacts';
import SendTokenAssetsScreen from 'screens/SendToken/SendTokenAssets';
import SendTokenPinConfirmScreen from 'screens/SendToken/SendTokenPinConfirmScreen';
import SendTokenConfirmScreen from 'screens/SendToken/SendTokenConfirm';
import SendTokenTransactionScreen from 'screens/SendToken/SendTokenTransaction';
import SendBitcoinPinConfirmScreen from 'screens/SendBitcoin/SendBitcoinPinConfirmScreen';
import SendBitcoinConfirmScreen from 'screens/SendBitcoin/SendBitcoinConfirm';
import SendBitcoinTransactionScreen from 'screens/SendBitcoin/SendBitcoinTransaction';
import SendCollectibleConfirmScreen from 'screens/SendCollectible/SendCollectibleConfirm';
import PPNSendTokenAmountScreen from 'screens/Tank/SendToken/PPNSendTokenAmount';
import HomeScreen from 'screens/Home';
import LoginScreen from 'screens/Home/Login';
import BackupPhraseScreen from 'screens/BackupPhrase';
import BackupPhraseValidateScreen from 'screens/BackupPhraseValidate';
import CollectibleScreen from 'screens/Collectible';
import WalletConnectSessionRequest from 'screens/WalletConnect/WalletConnectSessionRequest';
import WalletConnectCallRequest from 'screens/WalletConnect/WalletConnectCallRequest';
import WalletConnectPinConfirm from 'screens/WalletConnect/WalletConnectPinConfirm';
import BadgeScreen from 'screens/Badge';
import OTPScreen from 'screens/OTP';
import ConnectedContactInfo from 'screens/ContactInfo';
import ConfirmClaimScreen from 'screens/Referral/ConfirmClaimScreen';
import UpgradeInfoScreen from 'screens/UpgradeToSmartWallet/UpgradeInfoScreen';
import RecoveryAgentsScreen from 'screens/UpgradeToSmartWallet/RecoveryAgentsScreen';
import ChooseAssetsScreen from 'screens/UpgradeToSmartWallet/ChooseAssetsScreen';
import EditAssetAmountScreen from 'screens/UpgradeToSmartWallet/EditAssetAmountScreen';
import UpgradeReviewScreen from 'screens/UpgradeToSmartWallet/UpgradeReviewScreen';
import UpgradeConfirmScreen from 'screens/UpgradeToSmartWallet/UpgradeConfirmScreen';
import SmartWalletUnlockScreen from 'screens/UpgradeToSmartWallet/SmartWalletUnlock';
import FundTankScreen from 'screens/Tank/FundTank';
import FundConfirmScreen from 'screens/Tank/FundConfirm';
import SettleBalanceScreen from 'screens/Tank/SettleBalance';
import SettleBalanceConfirmScreen from 'screens/Tank/SettleBalanceConfirm';
import TankWithdrawalScreen from 'screens/Tank/TankWithdrawal';
import TankWithdrawalConfirmScreen from 'screens/Tank/TankWithdrawalConfirm';
import ManageDetailsSessionsScreen from 'screens/ManageDetailsSessions';
import AccountsScreen from 'screens/Accounts';
import PillarNetworkIntro from 'screens/PillarNetwork/PillarNetworkIntro';
import UserSettingsScreen from 'screens/Users/UserSettings';
import AddOrEditUserScreen from 'screens/Users/AddOrEditUser';
import SettingsScreen from 'screens/Settings';
import ChatScreen from 'screens/Chat';
import FiatExchangeScreen from 'screens/FiatExchange';
import FiatCryptoScreen from 'screens/FiatExchange/FiatCrypto';
import SmartWalletIntroScreen from 'screens/UpgradeToSmartWallet/SmartWalletIntro';
import UnsettledAssetsScreen from 'screens/UnsettledAssets';
import SendSyntheticAssetScreen from 'screens/SendSynthetic/SendSyntheticAsset';
import SendSyntheticConfirmScreen from 'screens/SendSynthetic/SendSyntheticConfirm';
import SendSyntheticAmountScreen from 'screens/SendSynthetic/SendSyntheticAmount';
import SendSyntheticUnavailableScreen from 'screens/SendSynthetic/SendSyntheticUnavailable';
import LogoutPendingScreen from 'screens/LogoutPending';
import ServicesScreen from 'screens/Services';
import StorybookScreen from 'screens/Storybook';

// components
import RetryApiRegistration from 'components/RetryApiRegistration';
import CustomTabBarComponent from 'components/CustomTabBarComponent';
import Toast from 'components/Toast';
import { BaseText } from 'components/Typography';

// actions
import {
  stopListeningNotificationsAction,
  startListeningNotificationsAction,
  startListeningIntercomNotificationsAction,
  stopListeningIntercomNotificationsAction,
  startListeningChatWebSocketAction,
  stopListeningChatWebSocketAction,
} from 'actions/notificationsActions';
import { fetchInviteNotificationsAction } from 'actions/invitationsActions';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import {
  fetchTransactionsHistoryNotificationsAction,
  startListeningForBalanceChangeAction,
  stopListeningForBalanceChangeAction,
} from 'actions/historyActions';
import { getExistingChatsAction } from 'actions/chatActions';
import { updateSignalInitiatedStateAction } from 'actions/sessionActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import { removePrivateKeyFromMemoryAction } from 'actions/walletActions';
import { signalInitAction } from 'actions/signalClientActions';
import { endWalkthroughAction } from 'actions/walkthroughsActions';
import { handleSystemDefaultThemeChangeAction } from 'actions/appSettingsActions';

// constants
import {
  ASSETS,
  ASSET,
  SERVICES_TAB,
  EXCHANGE,
  EXCHANGE_CONFIRM,
  EXCHANGE_INFO,
  EXCHANGE_RECEIVE_EXPLAINED,
  PROFILE,
  PEOPLE,
  CONTACT,
  HOME,
  HOME_TAB,
  LOGIN,
  CONNECTION_REQUESTS,
  CHANGE_PIN_FLOW,
  CHANGE_PIN_CURRENT_PIN,
  CHANGE_PIN_NEW_PIN,
  CHANGE_PIN_CONFIRM_NEW_PIN,
  TAB_NAVIGATION,
  SEND_BITCOIN_FLOW,
  SEND_BITCOIN_CONFIRM,
  SEND_BITCOIN_TRANSACTION,
  SEND_BITCOIN_PIN_CONFIRM,
  SEND_TOKEN_AMOUNT,
  SEND_TOKEN_CONTACTS,
  SEND_TOKEN_ASSETS,
  SEND_TOKEN_CONFIRM,
  SEND_TOKEN_TRANSACTION,
  SEND_TOKEN_FROM_ASSET_FLOW,
  SEND_TOKEN_FROM_CONTACT_FLOW,
  SEND_TOKEN_PIN_CONFIRM,
  REVEAL_BACKUP_PHRASE,
  AUTH_FLOW,
  BACKUP_PHRASE,
  BACKUP_PHRASE_VALIDATE,
  BACKUP_WALLET_IN_SETTINGS_FLOW,
  COLLECTIBLE,
  SEND_COLLECTIBLE_FROM_ASSET_FLOW,
  SEND_COLLECTIBLE_CONFIRM,
  WALLETCONNECT_FLOW,
  WALLETCONNECT_SESSION_REQUEST_SCREEN,
  WALLETCONNECT_CALL_REQUEST_SCREEN,
  WALLETCONNECT_PIN_CONFIRM_SCREEN,
  BADGE,
  OTP,
  CONFIRM_CLAIM,
  UPGRADE_TO_SMART_WALLET_FLOW,
  UPGRADE_INFO,
  RECOVERY_AGENTS,
  CHOOSE_ASSETS_TO_TRANSFER,
  EDIT_ASSET_AMOUNT_TO_TRANSFER,
  UPGRADE_REVIEW,
  UPGRADE_CONFIRM,
  SMART_WALLET_UNLOCK,
  TANK_SETTLE_FLOW,
  TANK_FUND_FLOW,
  FUND_TANK,
  FUND_CONFIRM,
  SETTLE_BALANCE,
  SETTLE_BALANCE_CONFIRM,
  MANAGE_WALLETS_FLOW,
  MANAGE_DETAILS_SESSIONS,
  CONTACT_INFO,
  ACCOUNTS,
  PILLAR_NETWORK_INTRO,
  MANAGE_USERS_FLOW,
  USER_SETTINGS,
  ADD_EDIT_USER,
  SETTINGS,
  CHAT,
  FIAT_EXCHANGE,
  FIAT_CRYPTO,
  SMART_WALLET_INTRO,
  PPN_SEND_TOKEN_AMOUNT,
  PPN_SEND_TOKEN_FROM_ASSET_FLOW,
  PPN_SEND_SYNTHETIC_ASSET_FLOW,
  UNSETTLED_ASSETS,
  TANK_WITHDRAWAL_FLOW,
  TANK_WITHDRAWAL,
  TANK_WITHDRAWAL_CONFIRM,
  SEND_SYNTHETIC_ASSET,
  SEND_SYNTHETIC_CONFIRM,
  SEND_SYNTHETIC_AMOUNT,
  SEND_SYNTHETIC_UNAVAILABLE,
  LOGOUT_PENDING,
  UNSETTLED_ASSETS_FLOW,
  SERVICES,
  STORYBOOK,
} from 'constants/navigationConstants';
import { PENDING, REGISTERED } from 'constants/userConstants';

import { TYPE_CANCELLED, TYPE_BLOCKED, TYPE_REJECTED, TYPE_DISCONNECTED } from 'constants/invitationsConstants';

// utils
import { fontSizes } from 'utils/variables';
import { initWalletConnectSessions } from 'actions/walletConnectActions';
import { modalTransition, addAppStateChangeListener, removeAppStateChangeListener } from 'utils/common';
import { getThemeColors } from 'utils/themes';

import type { Theme } from 'models/Theme';

const SLEEP_TIMEOUT = 20000;
const ACTIVE_APP_STATE = 'active';
const BACKGROUND_APP_STATE = 'background';
const APP_LOGOUT_STATES = [BACKGROUND_APP_STATE];

const iconWallet = require('assets/icons/icon_wallet_outline.png');
const iconServices = require('assets/icons/icon_services.png');
const iconPeople = require('assets/icons/icon_people_smrt.png');
const iconHome = require('assets/icons/icon_home_smrt.png');
const iconWalletActive = require('assets/icons/icon_wallet_active_smrt.png');
const iconServicesActive = require('assets/icons/icon_services_active.png');
const iconPeopleActive = require('assets/icons/icon_people_active_smrt.png');
const iconHomeActive = require('assets/icons/icon_home_active_smrt.png');

const connectionMessagesToExclude = [TYPE_CANCELLED, TYPE_BLOCKED, TYPE_REJECTED, TYPE_DISCONNECTED];

const StackNavigatorModalConfig = {
  transitionConfig: () => ({
    transitionSpec: {
      duration: 0,
      timing: Animated.timing,
      easing: Easing.step0,
    },
  }),
  defaultNavigationOptions: {
    header: null,
  },
};

const StackNavigatorConfig = {
  defaultNavigationOptions: {
    header: null,
    gesturesEnabled: true,
  },
};

const hideTabNavigatorOnChildView = ({ navigation }) => {
  const tabBarVisible = navigation.state.index < 1;
  return {
    tabBarVisible,
    animationEnabled: true,
  };
};

// ASSETS FLOW
const assetsFlow = createStackNavigator(
  {
    [ASSETS]: AssetsScreen,
    [ASSET]: AssetScreen,
    [COLLECTIBLE]: CollectibleScreen,
    [CONTACT]: ContactScreen,
    [SETTINGS]: SettingsScreen,
    [EXCHANGE]: ExchangeScreen,
  },
  StackNavigatorConfig,
);

assetsFlow.navigationOptions = hideTabNavigatorOnChildView;

// SERVICES FLOW
const servicesFlow = createStackNavigator({
  [SERVICES]: ServicesScreen,
  [EXCHANGE]: ExchangeScreen,
  [EXCHANGE_CONFIRM]: ExchangeConfirmScreen,
  [EXCHANGE_RECEIVE_EXPLAINED]: ExchangeReceiveExplained,
  [EXCHANGE_INFO]: ExchangeInfoScreen,
  [FIAT_EXCHANGE]: FiatExchangeScreen,
  [FIAT_CRYPTO]: FiatCryptoScreen,
}, StackNavigatorConfig);

servicesFlow.navigationOptions = hideTabNavigatorOnChildView;

// PEOPLE FLOW
const peopleFlow = createStackNavigator({
  [PEOPLE]: PeopleScreen,
  [CONTACT]: ContactScreen,
  [CONNECTION_REQUESTS]: ConnectionRequestsScreen,
  [COLLECTIBLE]: CollectibleScreen,
  [BADGE]: BadgeScreen,
  [CHAT]: ChatScreen,
}, StackNavigatorConfig);

peopleFlow.navigationOptions = hideTabNavigatorOnChildView;

// WALLETCONNECT FLOW
const walletConnectFlow = createStackNavigator(
  {
    [WALLETCONNECT_SESSION_REQUEST_SCREEN]: WalletConnectSessionRequest,
    [WALLETCONNECT_CALL_REQUEST_SCREEN]: WalletConnectCallRequest,
    [WALLETCONNECT_PIN_CONFIRM_SCREEN]: WalletConnectPinConfirm,
  },
  StackNavigatorModalConfig,
);

// HOME FLOW
const homeFlow = createStackNavigator({
  [HOME]: HomeScreen,
  [SETTINGS]: SettingsScreen,
  [LOGIN]: LoginScreen,
  [PROFILE]: ProfileScreen,
  [OTP]: OTPScreen,
  [CONFIRM_CLAIM]: ConfirmClaimScreen,
  [CONTACT]: ContactScreen,
  [COLLECTIBLE]: CollectibleScreen,
  [BADGE]: BadgeScreen,
  [MANAGE_DETAILS_SESSIONS]: ManageDetailsSessionsScreen,
  [CHAT]: ChatScreen,
  [STORYBOOK]: StorybookScreen,
}, StackNavigatorConfig);

homeFlow.navigationOptions = hideTabNavigatorOnChildView;

const tabBarIcon = ({
  iconActive,
  icon,
  hasIndicator,
  theme,
}) => ({ focused }) => {
  const colors = getThemeColors(theme);

  return (
    <View style={{ padding: 4 }}>
      <Image
        style={{
          width: 24,
          height: 24,
          tintColor: focused ? colors.primary : colors.navbarItems,
        }}
        resizeMode="contain"
        source={focused ? iconActive : icon}
      />
      {!!hasIndicator && (
        <View
          style={{
            width: 8,
            height: 8,
            backgroundColor: colors.indicator,
            borderRadius: 4,
            position: 'absolute',
            top: 4,
            right: 4,
          }}
        />
      )}
    </View>
  );
};

const tabBarLabel = ({ text, theme }) => ({ focused }) => {
  const colors = getThemeColors(theme);
  return (
    <BaseText
      style={{
        fontSize: fontSizes.regular,
        color: focused ? colors.primary : colors.navbarItems,
        textAlign: 'center',
      }}
      numberOfLines={1}
    >
      {text}
    </BaseText>
  );
};

// TAB NAVIGATION FLOW
const tabNavigation = createBottomTabNavigator(
  {
    [HOME_TAB]: {
      screen: homeFlow,
      navigationOptions: ({ navigation, screenProps }) => ({
        tabBarIcon: tabBarIcon({
          iconActive: iconHomeActive,
          icon: iconHome,
          hasIndicator: !navigation.isFocused() && (screenProps.hasUnreadNotifications
            || !!screenProps.intercomNotificationsCount),
          theme: screenProps.theme,
        }),
        tabBarLabel: tabBarLabel({ text: 'Home', theme: screenProps.theme }),
      }),
    },
    [ASSETS]: {
      screen: assetsFlow,
      navigationOptions: ({ screenProps }) => ({
        tabBarIcon: tabBarIcon({
          iconActive: iconWalletActive,
          icon: iconWallet,
          hasIndicator: false,
          theme: screenProps.theme,
        }),
        tabBarLabel: tabBarLabel({ text: 'Assets', theme: screenProps.theme }),
      }),
    },
    [PEOPLE]: {
      screen: peopleFlow,
      navigationOptions: ({ navigation, screenProps }) => ({
        tabBarIcon: tabBarIcon({
          iconActive: iconPeopleActive,
          icon: iconPeople,
          hasIndicator: !navigation.isFocused() && screenProps.hasUnreadChatNotifications,
          theme: screenProps.theme,
        }),
        tabBarLabel: tabBarLabel({ text: 'People', theme: screenProps.theme }),
      }),
    },
    [SERVICES_TAB]: {
      screen: servicesFlow,
      navigationOptions: ({ screenProps }) => ({
        tabBarIcon: tabBarIcon({
          iconActive: iconServicesActive,
          icon: iconServices,
          hasIndicator: false,
          theme: screenProps.theme,
        }),
        tabBarLabel: tabBarLabel({ text: 'Services', theme: screenProps.theme }),
      }),
    },
  }, {
    tabBarOptions: {
      style: {
        elevation: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        borderTopColor: 'transparent',
        paddingTop: 5,
        paddingBottom: 5,
        height: 54,
      },
    },
    tabBarPosition: 'bottom',
    animationEnabled: false,
    swipeEnabled: false,
    tabBarComponent: props => <CustomTabBarComponent {...props} />,
  },
);

// SEND TOKEN FROM ASSET FLOW
const sendTokenFromAssetFlow = createStackNavigator(
  {
    [SEND_TOKEN_CONTACTS]: SendTokenContactsScreen,
    [SEND_TOKEN_AMOUNT]: SendTokenAmountScreen,
    [SEND_TOKEN_CONFIRM]: SendTokenConfirmScreen,
    [SEND_TOKEN_PIN_CONFIRM]: SendTokenPinConfirmScreen,
    [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
    [CHAT]: ChatScreen,
    [CONTACT]: ContactScreen,
  },
  StackNavigatorModalConfig,
);

// SEND BITCOIN FROM ASSET FLOW
const sendBitcoinFromAssetFlow = createStackNavigator(
  {
    [SEND_TOKEN_CONTACTS]: SendTokenContactsScreen,
    [SEND_TOKEN_AMOUNT]: SendTokenAmountScreen,
    [SEND_BITCOIN_CONFIRM]: SendBitcoinConfirmScreen,
    [SEND_BITCOIN_PIN_CONFIRM]: SendBitcoinPinConfirmScreen,
    [SEND_BITCOIN_TRANSACTION]: SendBitcoinTransactionScreen,
  },
  StackNavigatorModalConfig,
);

// SEND ASSETS FROM CONTACT FLOW
const sendTokenFromContactFlow = createStackNavigator({
  [SEND_TOKEN_ASSETS]: SendTokenAssetsScreen,
  // tokens
  [SEND_TOKEN_AMOUNT]: SendTokenAmountScreen,
  [SEND_TOKEN_CONFIRM]: SendTokenConfirmScreen,
  [SEND_TOKEN_PIN_CONFIRM]: SendTokenPinConfirmScreen,
  [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
  // collectibles
  [SEND_COLLECTIBLE_CONFIRM]: SendCollectibleConfirmScreen,
  [SEND_TOKEN_PIN_CONFIRM]: SendTokenPinConfirmScreen,
  [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
}, StackNavigatorModalConfig);

// SEND COLLECTIBLE FROM ASSET FLOW
const sendCollectibleFromAssetFlow = createStackNavigator({
  [SEND_TOKEN_CONTACTS]: SendTokenContactsScreen,
  [SEND_COLLECTIBLE_CONFIRM]: SendCollectibleConfirmScreen,
  [SEND_TOKEN_PIN_CONFIRM]: SendTokenPinConfirmScreen,
  [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
}, StackNavigatorModalConfig);

const changePinFlow = createStackNavigator({
  [CHANGE_PIN_CURRENT_PIN]: ChangePinCurrentPinScreen,
  [CHANGE_PIN_NEW_PIN]: ChangePinNewPinScreen,
  [CHANGE_PIN_CONFIRM_NEW_PIN]: ChangePinConfirmNewPinScreen,
}, StackNavigatorModalConfig);

// WALLET BACKUP IN SETTINGS FLOW
const backupWalletFlow = createStackNavigator({
  [BACKUP_PHRASE]: BackupPhraseScreen,
  [BACKUP_PHRASE_VALIDATE]: BackupPhraseValidateScreen,
}, StackNavigatorModalConfig);

// UPGRADE TO SMART WALLET FLOW
const smartWalletUpgradeFlow = createStackNavigator({
  [CHOOSE_ASSETS_TO_TRANSFER]: ChooseAssetsScreen,
  [UPGRADE_INFO]: UpgradeInfoScreen,
  [RECOVERY_AGENTS]: RecoveryAgentsScreen,
  [EDIT_ASSET_AMOUNT_TO_TRANSFER]: EditAssetAmountScreen,
  [UPGRADE_REVIEW]: UpgradeReviewScreen,
  [UPGRADE_CONFIRM]: UpgradeConfirmScreen,
  [SMART_WALLET_UNLOCK]: SmartWalletUnlockScreen,
}, StackNavigatorConfig);

smartWalletUpgradeFlow.navigationOptions = hideTabNavigatorOnChildView;

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
    [SEND_SYNTHETIC_ASSET]: SendSyntheticAssetScreen,
    [SEND_TOKEN_CONTACTS]: SendTokenContactsScreen,
    // synthetic
    [SEND_SYNTHETIC_AMOUNT]: SendSyntheticAmountScreen,
    [SEND_SYNTHETIC_CONFIRM]: SendSyntheticConfirmScreen,
    [SEND_TOKEN_PIN_CONFIRM]: SendTokenPinConfirmScreen,
    [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
    [SEND_SYNTHETIC_UNAVAILABLE]: SendSyntheticUnavailableScreen,
    // other
    [SEND_TOKEN_AMOUNT]: SendTokenAmountScreen,
    [SEND_TOKEN_CONFIRM]: SendTokenConfirmScreen,
    [SEND_TOKEN_PIN_CONFIRM]: SendTokenPinConfirmScreen,
    [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
  },
  StackNavigatorModalConfig,
);

// MANAGE WALLETS FLOW
const manageWalletsFlow = createStackNavigator({
  [ACCOUNTS]: AccountsScreen,
  [FUND_CONFIRM]: FundConfirmScreen,
  [RECOVERY_AGENTS]: RecoveryAgentsScreen,
}, StackNavigatorConfig);

manageWalletsFlow.navigationOptions = hideTabNavigatorOnChildView;

// MANAGE USERS FLOW
const manageUsersFlow = createStackNavigator({
  [USER_SETTINGS]: UserSettingsScreen,
  [ADD_EDIT_USER]: AddOrEditUserScreen,
}, StackNavigatorConfig);

manageUsersFlow.navigationOptions = hideTabNavigatorOnChildView;

// TANK FLOWS
const tankSettleFlow = createStackNavigator({
  [SETTLE_BALANCE]: SettleBalanceScreen,
  [SETTLE_BALANCE_CONFIRM]: SettleBalanceConfirmScreen,
}, StackNavigatorConfig);

tankSettleFlow.navigationOptions = hideTabNavigatorOnChildView;

// UNSETTLED ASSETS FLOW
const unsettledAssetsFlow = createStackNavigator({
  [UNSETTLED_ASSETS]: UnsettledAssetsScreen,
  [SETTLE_BALANCE]: SettleBalanceScreen,
  [SETTLE_BALANCE_CONFIRM]: SettleBalanceConfirmScreen,
}, StackNavigatorConfig);

unsettledAssetsFlow.navigationOptions = hideTabNavigatorOnChildView;

const tankFundFlow = createStackNavigator({
  [FUND_TANK]: FundTankScreen,
  [FUND_CONFIRM]: FundConfirmScreen,
}, StackNavigatorConfig);

tankFundFlow.navigationOptions = hideTabNavigatorOnChildView;

const tankWithdrawalFlow = createStackNavigator({
  [TANK_WITHDRAWAL]: TankWithdrawalScreen,
  [TANK_WITHDRAWAL_CONFIRM]: TankWithdrawalConfirmScreen,
}, StackNavigatorConfig);

tankWithdrawalFlow.navigationOptions = hideTabNavigatorOnChildView;

// APP NAVIGATION FLOW
const AppFlowNavigation = createStackNavigator(
  {
    [TAB_NAVIGATION]: tabNavigation,
    [SEND_TOKEN_FROM_ASSET_FLOW]: sendTokenFromAssetFlow,
    [SEND_BITCOIN_FLOW]: sendBitcoinFromAssetFlow,
    [PPN_SEND_TOKEN_FROM_ASSET_FLOW]: ppnSendTokenFromAssetFlow,
    [PPN_SEND_SYNTHETIC_ASSET_FLOW]: ppnSendSyntheticAssetFlow,
    [SEND_TOKEN_FROM_CONTACT_FLOW]: sendTokenFromContactFlow,
    [SEND_COLLECTIBLE_FROM_ASSET_FLOW]: sendCollectibleFromAssetFlow,
    [CHANGE_PIN_FLOW]: changePinFlow,
    [REVEAL_BACKUP_PHRASE]: RevealBackupPhraseScreen,
    [BACKUP_WALLET_IN_SETTINGS_FLOW]: backupWalletFlow,
    [UPGRADE_TO_SMART_WALLET_FLOW]: smartWalletUpgradeFlow,
    [MANAGE_WALLETS_FLOW]: manageWalletsFlow,
    [TANK_SETTLE_FLOW]: tankSettleFlow,
    [UNSETTLED_ASSETS_FLOW]: unsettledAssetsFlow,
    [TANK_FUND_FLOW]: tankFundFlow,
    [TANK_WITHDRAWAL_FLOW]: tankWithdrawalFlow,
    [WALLETCONNECT_FLOW]: walletConnectFlow,
    [MANAGE_USERS_FLOW]: manageUsersFlow,
    [CONTACT_INFO]: ConnectedContactInfo,
    [PILLAR_NETWORK_INTRO]: PillarNetworkIntro,
    [SMART_WALLET_INTRO]: SmartWalletIntroScreen,
    [LOGOUT_PENDING]: LogoutPendingScreen,
  },
  modalTransition,
);

type Props = {
  userState: ?string,
  profileImage: ?string,
  fetchAppSettingsAndRedirect: Function,
  startListeningNotifications: Function,
  stopListeningNotifications: Function,
  startListeningIntercomNotifications: Function,
  stopListeningIntercomNotifications: Function,
  startListeningChatWebSocket: Function,
  stopListeningChatWebSocket: Function,
  initWalletConnect: Function,
  fetchAssetsBalances: () => Function,
  fetchTransactionsHistoryNotifications: Function,
  fetchInviteNotifications: Function,
  getExistingChats: Function,
  notifications: Object[],
  hasUnreadNotifications: boolean,
  hasUnreadChatNotifications: boolean,
  intercomNotificationsCount: number,
  navigation: NavigationScreenProp<*>,
  wallet: Object,
  backupStatus: Object,
  isPickingImage: boolean,
  updateSignalInitiatedState: Function,
  fetchAllCollectiblesData: Function,
  removePrivateKeyFromMemory: Function,
  smartWalletFeatureEnabled: boolean,
  isBrowsingWebView: boolean,
  startListeningForBalanceChange: Function,
  stopListeningForBalanceChange: Function,
  isOnline: boolean,
  initSignal: Function,
  endWalkthrough: () => void,
  theme: Theme,
  handleSystemDefaultThemeChange: () => void,
}

type State = {
  lastAppState: string,
};

let lockTimer;

class AppFlow extends React.Component<Props, State> {
  state = {
    lastAppState: AppState.currentState,
  };

  componentDidMount() {
    const {
      startListeningNotifications,
      startListeningIntercomNotifications,
      startListeningChatWebSocket,
      fetchInviteNotifications,
      fetchTransactionsHistoryNotifications,
      fetchAssetsBalances,
      getExistingChats,
      fetchAllCollectiblesData,
      initWalletConnect,
      startListeningForBalanceChange,
    } = this.props;
    startListeningNotifications();
    startListeningIntercomNotifications();
    fetchAssetsBalances();
    fetchInviteNotifications();
    fetchTransactionsHistoryNotifications();
    getExistingChats();
    fetchAllCollectiblesData();
    startListeningChatWebSocket();
    initWalletConnect();
    startListeningForBalanceChange();
    addAppStateChangeListener(this.handleAppStateChange);
  }

  componentDidUpdate(prevProps: Props) {
    const {
      notifications,
      userState,
      wallet,
      removePrivateKeyFromMemory,
      isOnline,
      startListeningChatWebSocket,
      stopListeningChatWebSocket,
      initSignal,
    } = this.props;
    const { notifications: prevNotifications, isOnline: prevIsOnline } = prevProps;

    if (userState === REGISTERED && wallet.privateKey) {
      removePrivateKeyFromMemory();
    }

    if (prevIsOnline !== isOnline) {
      if (isOnline) {
        // try initializing Signal in case of user user logged to wallet while being offline and then switched
        initSignal();
        startListeningChatWebSocket();
      } else {
        stopListeningChatWebSocket();
      }
    }

    if (notifications.length && notifications.length !== prevNotifications.length) {
      const lastNotification = notifications[notifications.length - 1];

      if (lastNotification.type === 'CONNECTION' && connectionMessagesToExclude.includes(lastNotification.status)) {
        return;
      }

      Toast.show({
        message: lastNotification.message,
        type: lastNotification.messageType,
        title: lastNotification.title,
        autoClose: lastNotification.autoClose,
      });
    }
  }

  componentWillUnmount() {
    const {
      stopListeningNotifications,
      stopListeningIntercomNotifications,
      stopListeningChatWebSocket,
      updateSignalInitiatedState,
      stopListeningForBalanceChange,
    } = this.props;
    stopListeningNotifications();
    stopListeningIntercomNotifications();
    stopListeningChatWebSocket();
    updateSignalInitiatedState(false);
    stopListeningForBalanceChange();
    removeAppStateChangeListener(this.handleAppStateChange);
  }

  handleAppStateChange = (nextAppState: string) => {
    const {
      stopListeningNotifications,
      stopListeningIntercomNotifications,
      startListeningChatWebSocket,
      stopListeningChatWebSocket,
      updateSignalInitiatedState,
      navigation,
      isPickingImage,
      isBrowsingWebView,
      stopListeningForBalanceChange,
      endWalkthrough,
      handleSystemDefaultThemeChange,
    } = this.props;
    const { lastAppState } = this.state;
    BackgroundTimer.clearTimeout(lockTimer);
    if (isPickingImage || isBrowsingWebView) return;
    // only checking if background state for logout or websocket channel close
    if (APP_LOGOUT_STATES.includes(nextAppState)) {
      // close websocket channel instantly to receive PN while in background
      stopListeningChatWebSocket();
      // close walkthrough shade or tooltips
      endWalkthrough();
      lockTimer = BackgroundTimer.setTimeout(() => {
        const pathAndParams = navigation.router.getPathAndParamsForState(navigation.state);
        const lastActiveScreen = pathAndParams.path.split('/').slice(-1)[0];
        const lastActiveScreenParams = pathAndParams.params;
        updateNavigationLastScreenState({ lastActiveScreen, lastActiveScreenParams });
        navigation.navigate(AUTH_FLOW);
        stopListeningNotifications();
        stopListeningIntercomNotifications();
        updateSignalInitiatedState(false);
        stopListeningForBalanceChange();
      }, SLEEP_TIMEOUT);
    } else if (APP_LOGOUT_STATES.includes(lastAppState)
      && nextAppState === ACTIVE_APP_STATE) {
      startListeningChatWebSocket();
      handleSystemDefaultThemeChange();
    }
    this.setState({ lastAppState: nextAppState });
  };

  render() {
    const {
      userState,
      profileImage,
      hasUnreadNotifications,
      intercomNotificationsCount,
      hasUnreadChatNotifications,
      navigation,
      backupStatus,
      smartWalletFeatureEnabled,
      theme,
    } = this.props;
    if (!userState) return null;
    if (userState === PENDING) {
      return <RetryApiRegistration />;
    }

    const { isImported, isBackedUp } = backupStatus;
    const isWalletBackedUp = isImported || isBackedUp;

    return (
      <AppFlowNavigation
        screenProps={{
          profileImage,
          hasUnreadNotifications,
          hasUnreadChatNotifications,
          intercomNotificationsCount,
          isWalletBackedUp,
          smartWalletFeatureEnabled,
          theme,
        }}
        navigation={navigation}
      />
    );
  }
}

const mapStateToProps = ({
  user: { data: { profileImage }, userState },
  notifications: {
    data: notifications,
    intercomNotificationsCount,
    hasUnreadNotifications,
    hasUnreadChatNotifications,
  },
  wallet: { data: wallet, backupStatus },
  appSettings: { data: { isPickingImage, isBrowsingWebView } },
  featureFlags: {
    data: {
      SMART_WALLET_ENABLED: smartWalletFeatureEnabled,
    },
  },
  session: { data: { isOnline } },
}) => ({
  profileImage,
  userState,
  notifications,
  hasUnreadNotifications,
  wallet,
  backupStatus,
  hasUnreadChatNotifications,
  intercomNotificationsCount,
  isPickingImage,
  smartWalletFeatureEnabled,
  isBrowsingWebView,
  isOnline,
});

const mapDispatchToProps = dispatch => ({
  stopListeningNotifications: () => dispatch(stopListeningNotificationsAction()),
  startListeningNotifications: () => dispatch(startListeningNotificationsAction()),
  stopListeningIntercomNotifications: () => dispatch(stopListeningIntercomNotificationsAction()),
  startListeningIntercomNotifications: () => dispatch(startListeningIntercomNotificationsAction()),
  stopListeningChatWebSocket: () => dispatch(stopListeningChatWebSocketAction()),
  startListeningChatWebSocket: () => dispatch(startListeningChatWebSocketAction()),
  initWalletConnect: () => dispatch(initWalletConnectSessions()),
  fetchAssetsBalances: () => dispatch(fetchAssetsBalancesAction()),
  fetchTransactionsHistoryNotifications: () => {
    dispatch(fetchTransactionsHistoryNotificationsAction());
  },
  fetchInviteNotifications: () => {
    dispatch(fetchInviteNotificationsAction());
  },
  getExistingChats: () => dispatch(getExistingChatsAction()),
  updateSignalInitiatedState: signalState => dispatch(updateSignalInitiatedStateAction(signalState)),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
  removePrivateKeyFromMemory: () => dispatch(removePrivateKeyFromMemoryAction()),
  startListeningForBalanceChange: () => dispatch(startListeningForBalanceChangeAction()),
  stopListeningForBalanceChange: () => dispatch(stopListeningForBalanceChangeAction()),
  initSignal: () => dispatch(signalInitAction()),
  endWalkthrough: () => dispatch(endWalkthroughAction()),
  handleSystemDefaultThemeChange: () => dispatch(handleSystemDefaultThemeChangeAction()),
});

const ConnectedAppFlow = connect(
  mapStateToProps,
  mapDispatchToProps,
)(AppFlow);
ConnectedAppFlow.router = AppFlowNavigation.router;
ConnectedAppFlow.defaultNavigationOptions = AppFlowNavigation.defaultNavigationOptions;

export default withTheme(ConnectedAppFlow);
