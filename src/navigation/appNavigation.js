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
import { withTranslation } from 'react-i18next';

// screens
import AssetsScreen from 'screens/Assets';
import AssetScreen from 'screens/Asset';
import AssetSearchScreen from 'screens/Assets/AssetSearch';
import ExchangeScreen from 'screens/Exchange';
import ExchangeConfirmScreen from 'screens/Exchange/ExchangeConfirm';
import ExchangeInfoScreen from 'screens/Exchange/ExchangeInfo';
import ExchangeReceiveExplained from 'screens/Exchange/ExchangeReceiveExplained';
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
import HomeScreen from 'screens/Home';
import BackupPhraseScreen from 'screens/BackupPhrase';
import BackupPhraseValidateScreen from 'screens/BackupPhraseValidate';
import CollectibleScreen from 'screens/Collectible';
import WalletConnectScreen from 'screens/WalletConnect';
import WalletConnectSessionRequest from 'screens/WalletConnect/WalletConnectSessionRequest';
import WalletConnectCallRequest from 'screens/WalletConnect/WalletConnectCallRequest';
import WalletConnectPinConfirm from 'screens/WalletConnect/WalletConnectPinConfirm';
import BadgeScreen from 'screens/Badge';
import OTPScreen from 'screens/OTP';
import ConfirmClaimScreen from 'screens/Referral/ConfirmClaimScreen';
import FundTankScreen from 'screens/Tank/FundTank';
import FundConfirmScreen from 'screens/Tank/FundConfirm';
import SettleBalanceScreen from 'screens/Tank/SettleBalance';
import SettleBalanceConfirmScreen from 'screens/Tank/SettleBalanceConfirm';
import TankWithdrawalScreen from 'screens/Tank/TankWithdrawal';
import TankWithdrawalConfirmScreen from 'screens/Tank/TankWithdrawalConfirm';
import ManageDetailsSessionsScreen from 'screens/ManageDetailsSessions';
import AccountsScreen from 'screens/Accounts';
import PillarNetworkIntro from 'screens/PillarNetwork/PillarNetworkIntro';
import AddOrEditUserScreen from 'screens/Users/AddOrEditUser';
import SmartWalletIntroScreen from 'screens/SmartWalletIntro';
import UnsettledAssetsScreen from 'screens/UnsettledAssets';
import SendSyntheticConfirmScreen from 'screens/SendSynthetic/SendSyntheticConfirm';
import SendSyntheticAmountScreen from 'screens/SendSynthetic/SendSyntheticAmount';
import LogoutPendingScreen from 'screens/LogoutPending';
import ReferFriendsScreen from 'screens/ReferFriends';
import ReferralSentScreen from 'screens/ReferFriends/ReferralSent';
import AccessToAddressBookScreen from 'screens/ReferFriends/AccessToAddressBook';
import ReferralContactsScreen from 'screens/ReferFriends/ReferralContacts';
import ServicesScreen from 'screens/Services';
import StorybookScreen from 'screens/Storybook';
import MenuScreen from 'screens/Menu';
import AppSettingsScreen from 'screens/Menu/AppSettings';
import CommunitySettingsScreen from 'screens/Menu/CommunitySettings';
import RecoverySettingsScreen from 'screens/Menu/RecoverySettings';
import SecuritySettingsScreen from 'screens/Menu/SecuritySettings';
import PinCodeUnlockScreen from 'screens/PinCodeUnlock';
import ExploreAppsScreen from 'screens/ExploreApps';
import WalletActivatedScreen from 'screens/WalletActivated';
import RecoveryPortalSetupIntoScreen from 'screens/RecoveryPortal/RecoveryPortalSetupIntro';
import RecoveryPortalSetupSignUpScreen from 'screens/RecoveryPortal/RecoveryPortalSetupSignUp';
import RecoveryPortalSetupConnectDeviceScreen from 'screens/RecoveryPortal/RecoveryPortalSetupConnectDevice';
import RecoveryPortalSetupCompleteScreen from 'screens/RecoveryPortal/RecoveryPortalSetupComplete';
import ManageConnectedDevicesScreen from 'screens/ConnectedDevices/ManageConnectedDevices';
import RemoveSmartWalletConnectedDeviceScreen from 'screens/ConnectedDevices/RemoveSmartWalletConnectedDevice';
import RecoveryPortalWalletRecoveryPendingScreen from 'screens/RecoveryPortal/RecoveryPortalWalletRecoveryPending';
import RecoveryPortalWalletRecoveryStartedSceeen from 'screens/RecoveryPortal/RecoveryPortalWalletRecoveryStarted';
import EmailPhoneMissingScreen from 'screens/ReferFriends/EmailPhoneMissing';
import ReferralIncomingRewardScreen from 'screens/ReferFriends/ReferralIncomingReward';
import PoolTogetherDashboardScreen from 'screens/PoolTogether/PoolTogetherDashboard';
import PoolTogetherPurchaseScreen from 'screens/PoolTogether/PoolTogetherPurchase';
import PoolTogetherPurchaseConfirmScreen from 'screens/PoolTogether/PoolTogetherPurchaseConfirm';
import PoolTogetherWithdrawScreen from 'screens/PoolTogether/PoolTogetherWithdraw';
import PoolTogetherWithdrawConfirmScreen from 'screens/PoolTogether/PoolTogetherWithdrawConfirm';
import ChooseAssetDepositScreen from 'screens/Lending/ChooseAssetDeposit';
import DepositedAssetsListScreen from 'screens/Lending/DepositedAssetsList';
import ViewDepositedAssetScreen from 'screens/Lending/ViewDepositedAsset';
import EnterDepositAmountScreen from 'screens/Lending/EnterDepositAmount';
import EnterWithdrawAmountScreen from 'screens/Lending/EnterWithdrawAmount';
import DepositTransactionConfirmScreen from 'screens/Lending/DepositTransactionConfirm';
import WithdrawTransactionConfirmScreen from 'screens/Lending/WithdrawTransactionConfirm';
import KeyBasedAssetTransferChooseScreen from 'screens/KeyBasedAssetTransfer/KeyBasedAssetTransferChoose';
import KeyBasedAssetTransferEditAmountScreen from 'screens/KeyBasedAssetTransfer/KeyBasedAssetTransferEditAmount';
import KeyBasedAssetTransferConfirmScreen from 'screens/KeyBasedAssetTransfer/KeyBasedAssetTransferConfirm';
import KeyBasedAssetTransferUnlockScreen from 'screens/KeyBasedAssetTransfer/KeyBasedAssetTransferUnlock';
import KeyBasedAssetTransferStatusScreen from 'screens/KeyBasedAssetTransfer/KeyBasedAssetTransferStatus';
import SablierStreamsScreen from 'screens/Sablier/SablierStreams';
import SablierNewStreamScreen from 'screens/Sablier/NewStream';
import SablierNewStreamReviewScreen from 'screens/Sablier/NewStreamReview';
import SablierIncomingStreamScreen from 'screens/Sablier/IncomingStream';
import SablierOutgoingStreamScreen from 'screens/Sablier/OutgoingStream';
import SablierWithdrawScreen from 'screens/Sablier/Withdraw';
import SablierWithdrawReviewScreen from 'screens/Sablier/WithdrawReview';

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
} from 'actions/notificationsActions';
import { checkForMissedAssetsAction, fetchAllAccountsBalancesAction } from 'actions/assetsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import { removePrivateKeyFromMemoryAction } from 'actions/walletActions';
import { endWalkthroughAction } from 'actions/walkthroughsActions';
import { handleSystemDefaultThemeChangeAction } from 'actions/appSettingsActions';

// constants
import {
  ASSETS,
  ASSET,
  ASSET_SEARCH,
  SERVICES_TAB,
  EXCHANGE,
  EXCHANGE_CONFIRM,
  EXCHANGE_INFO,
  EXCHANGE_RECEIVE_EXPLAINED,
  HOME,
  HOME_TAB,
  CHANGE_PIN_FLOW,
  CHANGE_PIN_CURRENT_PIN,
  CHANGE_PIN_NEW_PIN,
  CHANGE_PIN_CONFIRM_NEW_PIN,
  TAB_NAVIGATION,
  SEND_TOKEN_AMOUNT,
  SEND_TOKEN_CONFIRM,
  SEND_TOKEN_TRANSACTION,
  SEND_TOKEN_FROM_ASSET_FLOW,
  SEND_TOKEN_FROM_CONTACT_FLOW,
  SEND_TOKEN_PIN_CONFIRM,
  REVEAL_BACKUP_PHRASE,
  BACKUP_PHRASE,
  BACKUP_PHRASE_VALIDATE,
  BACKUP_WALLET_IN_SETTINGS_FLOW,
  COLLECTIBLE,
  SEND_COLLECTIBLE_FROM_ASSET_FLOW,
  SEND_COLLECTIBLE_CONFIRM,
  WALLETCONNECT_FLOW,
  WALLETCONNECT,
  WALLETCONNECT_SESSION_REQUEST_SCREEN,
  WALLETCONNECT_CALL_REQUEST_SCREEN,
  WALLETCONNECT_PIN_CONFIRM_SCREEN,
  BADGE,
  OTP,
  CONFIRM_CLAIM,
  TANK_SETTLE_FLOW,
  TANK_FUND_FLOW,
  FUND_TANK,
  FUND_CONFIRM,
  SETTLE_BALANCE,
  SETTLE_BALANCE_CONFIRM,
  MANAGE_WALLETS_FLOW,
  MANAGE_DETAILS_SESSIONS,
  ACCOUNTS,
  PILLAR_NETWORK_INTRO,
  MANAGE_USERS_FLOW,
  ADD_EDIT_USER,
  MENU,
  SMART_WALLET_INTRO,
  PPN_SEND_TOKEN_AMOUNT,
  PPN_SEND_TOKEN_FROM_ASSET_FLOW,
  PPN_SEND_SYNTHETIC_ASSET_FLOW,
  UNSETTLED_ASSETS,
  TANK_WITHDRAWAL_FLOW,
  TANK_WITHDRAWAL,
  TANK_WITHDRAWAL_CONFIRM,
  SEND_SYNTHETIC_AMOUNT,
  SEND_SYNTHETIC_CONFIRM,
  LOGOUT_PENDING,
  UNSETTLED_ASSETS_FLOW,
  REFER_FLOW,
  SERVICES,
  STORYBOOK,
  SECURITY_SETTINGS,
  RECOVERY_SETTINGS,
  COMMUNITY_SETTINGS,
  APP_SETTINGS,
  MENU_FLOW,
  REFER_MAIN_SCREEN,
  ADDRESS_BOOK_PERMISSION,
  REFERRAL_CONTACTS,
  CONNECT_TAB,
  SEND_TOKEN_FROM_HOME_FLOW,
  PIN_CODE,
  EXPLORE_APPS,
  WALLET_ACTIVATED,
  REFERRAL_SENT,
  RECOVERY_PORTAL_SETUP_FLOW,
  RECOVERY_PORTAL_RECOVERY_FLOW,
  RECOVERY_PORTAL_SETUP_INTRO,
  RECOVERY_PORTAL_SETUP_SIGN_UP,
  RECOVERY_PORTAL_SETUP_CONNECT_DEVICE,
  RECOVERY_PORTAL_SETUP_COMPLETE,
  MANAGE_CONNECTED_DEVICES,
  CONNECTED_DEVICES_FLOW,
  REMOVE_SMART_WALLET_CONNECTED_DEVICE,
  RECOVERY_PORTAL_WALLET_RECOVERY_PENDING,
  RECOVERY_PORTAL_WALLET_RECOVERY_STARTED,
  REFERRAL_CONTACT_INFO_MISSING,
  REFERRAL_INCOMING_REWARD,
  LENDING_CHOOSE_DEPOSIT,
  LENDING_DEPOSITED_ASSETS_LIST,
  LENDING_ADD_DEPOSIT_FLOW,
  LENDING_VIEW_DEPOSITED_ASSET,
  LENDING_ENTER_DEPOSIT_AMOUNT,
  LENDING_DEPOSIT_TRANSACTION_CONFIRM,
  LENDING_ENTER_WITHDRAW_AMOUNT,
  LENDING_WITHDRAW_DEPOSIT_FLOW,
  LENDING_WITHDRAW_TRANSACTION_CONFIRM,
  POOLTOGETHER_FLOW,
  POOLTOGETHER_DASHBOARD,
  POOLTOGETHER_PURCHASE,
  POOLTOGETHER_PURCHASE_CONFIRM,
  POOLTOGETHER_WITHDRAW,
  POOLTOGETHER_WITHDRAW_CONFIRM,
  KEY_BASED_ASSET_TRANSFER_CHOOSE,
  KEY_BASED_ASSET_TRANSFER_EDIT_AMOUNT,
  KEY_BASED_ASSET_TRANSFER_CONFIRM,
  KEY_BASED_ASSET_TRANSFER_UNLOCK,
  KEY_BASED_ASSET_TRANSFER_FLOW,
  KEY_BASED_ASSET_TRANSFER_STATUS,
  SABLIER_FLOW,
  SABLIER_STREAMS,
  SABLIER_NEW_STREAM,
  SABLIER_NEW_STREAM_REVIEW,
  SABLIER_INCOMING_STREAM,
  SABLIER_OUTGOING_STREAM,
  SABLIER_WITHDRAW,
  SABLIER_WITHDRAW_REVIEW,
} from 'constants/navigationConstants';
import { PENDING, REGISTERED } from 'constants/userConstants';

// utils
import { fontSizes } from 'utils/variables';
import { initWalletConnectSessions } from 'actions/walletConnectActions';
import { modalTransition, addAppStateChangeListener, removeAppStateChangeListener } from 'utils/common';
import { getThemeColors, lightThemeColors, darkThemeColors } from 'utils/themes';

import type { Theme } from 'models/Theme';
import type { I18n } from 'models/Translations';

const SLEEP_TIMEOUT = 20000;
const ACTIVE_APP_STATE = 'active';
const BACKGROUND_APP_STATE = 'background';
const APP_LOGOUT_STATES = [BACKGROUND_APP_STATE];

const iconWallet = require('assets/icons/icon_wallet_outline.png');
const iconServices = require('assets/icons/icon_services.png');
const iconHome = require('assets/icons/icon_home_smrt.png');
const iconConnect = require('assets/icons/icon_connect.png');

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
  cardStyle: {
    backgroundColor: {
      dark: darkThemeColors.surface,
      light: lightThemeColors.surface,
    },
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
    [ASSET_SEARCH]: AssetSearchScreen,
    [COLLECTIBLE]: CollectibleScreen,
    [EXCHANGE]: ExchangeScreen,
    [EXCHANGE_CONFIRM]: ExchangeConfirmScreen,
    [RECOVERY_SETTINGS]: RecoverySettingsScreen,
    [SECURITY_SETTINGS]: SecuritySettingsScreen,
    [EXCHANGE_INFO]: ExchangeInfoScreen,
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
  [POOLTOGETHER_DASHBOARD]: PoolTogetherDashboardScreen,
  [POOLTOGETHER_PURCHASE]: PoolTogetherPurchaseScreen,
  [POOLTOGETHER_PURCHASE_CONFIRM]: PoolTogetherPurchaseConfirmScreen,
  [POOLTOGETHER_WITHDRAW]: PoolTogetherWithdrawScreen,
  [POOLTOGETHER_WITHDRAW_CONFIRM]: PoolTogetherWithdrawConfirmScreen,
  [SABLIER_STREAMS]: SablierStreamsScreen,
  [SABLIER_INCOMING_STREAM]: SablierIncomingStreamScreen,
  [SABLIER_OUTGOING_STREAM]: SablierOutgoingStreamScreen,
  [SABLIER_NEW_STREAM]: SablierNewStreamScreen,
  [SABLIER_NEW_STREAM_REVIEW]: SablierNewStreamReviewScreen,
}, StackNavigatorConfig);

servicesFlow.navigationOptions = hideTabNavigatorOnChildView;


// REFER FLOW
const referFlow = createStackNavigator({
  [REFER_MAIN_SCREEN]: ReferFriendsScreen,
  [ADDRESS_BOOK_PERMISSION]: AccessToAddressBookScreen,
  [REFERRAL_CONTACTS]: ReferralContactsScreen,
}, StackNavigatorConfig);

referFlow.navigationOptions = hideTabNavigatorOnChildView;

// WALLETCONNECT FLOW
const walletConnectFlow = createStackNavigator(
  {
    [WALLETCONNECT]: WalletConnectScreen,
    [WALLETCONNECT_SESSION_REQUEST_SCREEN]: WalletConnectSessionRequest,
    [WALLETCONNECT_CALL_REQUEST_SCREEN]: WalletConnectCallRequest,
    [WALLETCONNECT_PIN_CONFIRM_SCREEN]: WalletConnectPinConfirm,
    [EXPLORE_APPS]: ExploreAppsScreen,
  },
  StackNavigatorConfig,
);
walletConnectFlow.navigationOptions = hideTabNavigatorOnChildView;


// HOME FLOW
const homeFlow = createStackNavigator({
  [HOME]: HomeScreen,
  [OTP]: OTPScreen,
  [CONFIRM_CLAIM]: ConfirmClaimScreen,
  [COLLECTIBLE]: CollectibleScreen,
  [BADGE]: BadgeScreen,
  [MANAGE_DETAILS_SESSIONS]: ManageDetailsSessionsScreen,
  [REFER_FLOW]: referFlow,
  [STORYBOOK]: StorybookScreen,
  [RECOVERY_SETTINGS]: RecoverySettingsScreen,
  [EXCHANGE]: ExchangeScreen,
  [EXCHANGE_CONFIRM]: ExchangeConfirmScreen,
  [ADD_EDIT_USER]: AddOrEditUserScreen,
  [SEND_TOKEN_AMOUNT]: SendTokenAmountScreen,
  [POOLTOGETHER_DASHBOARD]: PoolTogetherDashboardScreen,
  [POOLTOGETHER_PURCHASE]: PoolTogetherPurchaseScreen,
  [POOLTOGETHER_PURCHASE_CONFIRM]: PoolTogetherPurchaseConfirmScreen,
  [POOLTOGETHER_WITHDRAW]: PoolTogetherWithdrawScreen,
  [POOLTOGETHER_WITHDRAW_CONFIRM]: PoolTogetherWithdrawConfirmScreen,
}, StackNavigatorConfig);

homeFlow.navigationOptions = hideTabNavigatorOnChildView;

const tabBarIcon = ({
  icon,
  hasIndicator,
  theme,
}) => ({ focused }) => {
  const colors = getThemeColors(theme);
  const tintColor = focused ? colors.activeTabBarIcon : colors.inactiveTabBarIcon;

  return (
    <View style={{ padding: 4 }}>
      <Image
        style={{
          width: 24,
          height: 24,
          tintColor,
        }}
        resizeMode="contain"
        source={icon}
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
        color: focused ? colors.activeTabBarIcon : colors.inactiveTabBarIcon,
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
          icon: iconWallet,
          hasIndicator: false,
          theme: screenProps.theme,
        }),
        tabBarLabel: tabBarLabel({ text: 'Assets', theme: screenProps.theme }),
      }),
    },
    [CONNECT_TAB]: {
      screen: walletConnectFlow,
      navigationOptions: ({ screenProps }) => ({
        tabBarIcon: tabBarIcon({
          icon: iconConnect,
          hasIndicator: false,
          theme: screenProps.theme,
        }),
        tabBarLabel: tabBarLabel({ text: 'Connect', theme: screenProps.theme }),
      }),
    },
    [SERVICES_TAB]: {
      screen: servicesFlow,
      navigationOptions: ({ screenProps }) => ({
        tabBarIcon: tabBarIcon({
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
    [SEND_SYNTHETIC_CONFIRM]: SendSyntheticConfirmScreen,
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
const manageWalletsFlow = createStackNavigator({
  [ACCOUNTS]: AccountsScreen,
  [FUND_CONFIRM]: FundConfirmScreen,
}, StackNavigatorConfig);

manageWalletsFlow.navigationOptions = hideTabNavigatorOnChildView;

// MANAGE USERS FLOW
const manageUsersFlow = createStackNavigator({
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

const menuFlow = createStackNavigator({
  [MENU]: MenuScreen,
  [SECURITY_SETTINGS]: SecuritySettingsScreen,
  [RECOVERY_SETTINGS]: RecoverySettingsScreen,
  [COMMUNITY_SETTINGS]: CommunitySettingsScreen,
  [APP_SETTINGS]: AppSettingsScreen,
  [ADD_EDIT_USER]: AddOrEditUserScreen,
}, StackNavigatorConfig);

const recoveryPortalSetupFlow = createStackNavigator({
  [RECOVERY_PORTAL_SETUP_SIGN_UP]: RecoveryPortalSetupSignUpScreen,
  [RECOVERY_PORTAL_SETUP_CONNECT_DEVICE]: RecoveryPortalSetupConnectDeviceScreen,
  [RECOVERY_PORTAL_SETUP_COMPLETE]: RecoveryPortalSetupCompleteScreen,
}, StackNavigatorConfig);

recoveryPortalSetupFlow.navigationOptions = hideTabNavigatorOnChildView;

const connectedDevicesFlow = createStackNavigator({
  [MANAGE_CONNECTED_DEVICES]: ManageConnectedDevicesScreen,
  [REMOVE_SMART_WALLET_CONNECTED_DEVICE]: RemoveSmartWalletConnectedDeviceScreen,
}, StackNavigatorConfig);

connectedDevicesFlow.navigationOptions = hideTabNavigatorOnChildView;

const recoveryPortalRecoveryFlow = createStackNavigator({
  [RECOVERY_PORTAL_WALLET_RECOVERY_STARTED]: RecoveryPortalWalletRecoveryStartedSceeen,
  [RECOVERY_PORTAL_WALLET_RECOVERY_PENDING]: RecoveryPortalWalletRecoveryPendingScreen,
}, StackNavigatorConfig);

recoveryPortalRecoveryFlow.navigationOptions = hideTabNavigatorOnChildView;

// POOLTOGETHER FLOW
const poolTogetherFlow = createStackNavigator({
  [POOLTOGETHER_DASHBOARD]: PoolTogetherDashboardScreen,
  [POOLTOGETHER_PURCHASE]: PoolTogetherPurchaseScreen,
  [POOLTOGETHER_PURCHASE_CONFIRM]: PoolTogetherPurchaseConfirmScreen,
  [POOLTOGETHER_WITHDRAW]: PoolTogetherWithdrawScreen,
  [POOLTOGETHER_WITHDRAW_CONFIRM]: PoolTogetherWithdrawConfirmScreen,
}, StackNavigatorConfig);

poolTogetherFlow.navigationOptions = hideTabNavigatorOnChildView;

const lendingAddDepositsFlow = createStackNavigator({
  [LENDING_ENTER_DEPOSIT_AMOUNT]: EnterDepositAmountScreen,
  [LENDING_DEPOSIT_TRANSACTION_CONFIRM]: DepositTransactionConfirmScreen,
  [SEND_TOKEN_PIN_CONFIRM]: SendTokenPinConfirmScreen,
  [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
}, StackNavigatorConfig);

lendingAddDepositsFlow.navigationOptions = hideTabNavigatorOnChildView;

const lendingWithdrawDepositsFlow = createStackNavigator({
  [LENDING_ENTER_WITHDRAW_AMOUNT]: EnterWithdrawAmountScreen,
  [LENDING_WITHDRAW_TRANSACTION_CONFIRM]: WithdrawTransactionConfirmScreen,
  [SEND_TOKEN_PIN_CONFIRM]: SendTokenPinConfirmScreen,
  [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
}, StackNavigatorConfig);

lendingWithdrawDepositsFlow.navigationOptions = hideTabNavigatorOnChildView;

const keyBasedAssetTransferFlow = createStackNavigator({
  [KEY_BASED_ASSET_TRANSFER_CHOOSE]: KeyBasedAssetTransferChooseScreen,
  [KEY_BASED_ASSET_TRANSFER_EDIT_AMOUNT]: KeyBasedAssetTransferEditAmountScreen,
  [KEY_BASED_ASSET_TRANSFER_CONFIRM]: KeyBasedAssetTransferConfirmScreen,
  [KEY_BASED_ASSET_TRANSFER_UNLOCK]: KeyBasedAssetTransferUnlockScreen,
  [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
}, StackNavigatorConfig);

keyBasedAssetTransferFlow.navigationOptions = hideTabNavigatorOnChildView;

const sablierFlow = createStackNavigator({
  [SABLIER_STREAMS]: SablierStreamsScreen,
  [SABLIER_NEW_STREAM]: SablierNewStreamScreen,
  [SABLIER_NEW_STREAM_REVIEW]: SablierNewStreamReviewScreen,
  [SABLIER_INCOMING_STREAM]: SablierIncomingStreamScreen,
  [SABLIER_OUTGOING_STREAM]: SablierOutgoingStreamScreen,
  [SABLIER_WITHDRAW]: SablierWithdrawScreen,
  [SABLIER_WITHDRAW_REVIEW]: SablierWithdrawReviewScreen,
  [SEND_TOKEN_PIN_CONFIRM]: SendTokenPinConfirmScreen,
  [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
}, StackNavigatorConfig);

sablierFlow.navigationOptions = hideTabNavigatorOnChildView;

// APP NAVIGATION FLOW
const AppFlowNavigation = createStackNavigator(
  {
    [TAB_NAVIGATION]: tabNavigation,
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
    [MANAGE_USERS_FLOW]: manageUsersFlow,
    [PILLAR_NETWORK_INTRO]: PillarNetworkIntro,
    [SMART_WALLET_INTRO]: SmartWalletIntroScreen,
    [RECOVERY_PORTAL_SETUP_INTRO]: RecoveryPortalSetupIntoScreen,
    [RECOVERY_PORTAL_SETUP_FLOW]: recoveryPortalSetupFlow,
    [RECOVERY_PORTAL_RECOVERY_FLOW]: recoveryPortalRecoveryFlow,
    [POOLTOGETHER_FLOW]: poolTogetherFlow,
    [CONNECTED_DEVICES_FLOW]: connectedDevicesFlow,
    [LOGOUT_PENDING]: LogoutPendingScreen,
    [MENU_FLOW]: menuFlow,
    [SEND_TOKEN_FROM_HOME_FLOW]: sendTokenFlow,
    [PIN_CODE]: PinCodeUnlockScreen,
    [WALLET_ACTIVATED]: WalletActivatedScreen,
    [REFERRAL_SENT]: ReferralSentScreen,
    [REFERRAL_CONTACT_INFO_MISSING]: EmailPhoneMissingScreen,
    [REFERRAL_INCOMING_REWARD]: ReferralIncomingRewardScreen,
    [LENDING_CHOOSE_DEPOSIT]: ChooseAssetDepositScreen,
    [LENDING_VIEW_DEPOSITED_ASSET]: ViewDepositedAssetScreen,
    [LENDING_DEPOSITED_ASSETS_LIST]: DepositedAssetsListScreen,
    [LENDING_ADD_DEPOSIT_FLOW]: lendingAddDepositsFlow,
    [LENDING_WITHDRAW_DEPOSIT_FLOW]: lendingWithdrawDepositsFlow,
    [KEY_BASED_ASSET_TRANSFER_FLOW]: keyBasedAssetTransferFlow,
    [KEY_BASED_ASSET_TRANSFER_STATUS]: KeyBasedAssetTransferStatusScreen,
    [SABLIER_FLOW]: sablierFlow,
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
  initWalletConnect: Function,
  fetchAllAccountsBalances: () => Function,
  checkForMissedAssets: Function,
  notifications: Object[],
  hasUnreadNotifications: boolean,
  intercomNotificationsCount: number,
  navigation: NavigationScreenProp<*>,
  wallet: Object,
  backupStatus: Object,
  isPickingImage: boolean,
  fetchAllCollectiblesData: Function,
  removePrivateKeyFromMemory: Function,
  isBrowsingWebView: boolean,
  isOnline: boolean,
  endWalkthrough: () => void,
  theme: Theme,
  handleSystemDefaultThemeChange: () => void,
  i18n: I18n,
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
      checkForMissedAssets,
      fetchAllAccountsBalances,
      fetchAllCollectiblesData,
      initWalletConnect,
      backupStatus,
    } = this.props;

    /**
     * If wallet recovery is pending do not initiate any listeners
     * as we block user from accessing wallet, only pending screen is accessed.
     *
     * In future we can maybe unlock certain listeners/actions
     * depending on chosen product/business logic.
     */
    if (backupStatus.isRecoveryPending) return;

    startListeningNotifications();
    startListeningIntercomNotifications();
    fetchAllAccountsBalances();
    checkForMissedAssets();
    fetchAllCollectiblesData();
    initWalletConnect();
    addAppStateChangeListener(this.handleAppStateChange);
  }

  componentDidUpdate(prevProps: Props) {
    const {
      notifications,
      userState,
      wallet,
      removePrivateKeyFromMemory,
    } = this.props;
    const { notifications: prevNotifications } = prevProps;

    if (userState === REGISTERED && wallet.privateKey) {
      removePrivateKeyFromMemory();
    }

    if (notifications.length && notifications.length !== prevNotifications.length) {
      const lastNotification = notifications[notifications.length - 1];

      Toast.show({
        ...lastNotification,
      });
    }
  }

  componentWillUnmount() {
    const {
      stopListeningNotifications,
      stopListeningIntercomNotifications,
      backupStatus,
    } = this.props;

    // case per what's defined on componentWillMount
    if (backupStatus.isRecoveryPending) return;

    stopListeningNotifications();
    stopListeningIntercomNotifications();
    removeAppStateChangeListener(this.handleAppStateChange);
  }

  handleAppStateChange = (nextAppState: string) => {
    const {
      stopListeningNotifications,
      stopListeningIntercomNotifications,
      isPickingImage,
      isBrowsingWebView,
      endWalkthrough,
      handleSystemDefaultThemeChange,
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
        stopListeningIntercomNotifications();
      }, SLEEP_TIMEOUT);
    } else if (APP_LOGOUT_STATES.includes(lastAppState)
      && nextAppState === ACTIVE_APP_STATE) {
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
      navigation,
      backupStatus,
      theme,
      i18n,
    } = this.props;


    // wallet might be created, but recovery is pending and no user assigned yet
    if (!backupStatus.isRecoveryPending) {
      if (!userState) return null;
      if (userState === PENDING) return <RetryApiRegistration />;
    }

    const { isImported, isBackedUp } = backupStatus;
    const isWalletBackedUp = isImported || isBackedUp;

    return (
      <AppFlowNavigation
        screenProps={{
          profileImage,
          hasUnreadNotifications,
          intercomNotificationsCount,
          isWalletBackedUp,
          theme,
          language: i18n.language,
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
  },
  wallet: { data: wallet, backupStatus },
  appSettings: { data: { isPickingImage, isBrowsingWebView } },
  session: { data: { isOnline } },
}) => ({
  profileImage,
  userState,
  notifications,
  hasUnreadNotifications,
  wallet,
  backupStatus,
  intercomNotificationsCount,
  isPickingImage,
  isBrowsingWebView,
  isOnline,
});

const mapDispatchToProps = dispatch => ({
  stopListeningNotifications: () => dispatch(stopListeningNotificationsAction()),
  startListeningNotifications: () => dispatch(startListeningNotificationsAction()),
  stopListeningIntercomNotifications: () => dispatch(stopListeningIntercomNotificationsAction()),
  startListeningIntercomNotifications: () => dispatch(startListeningIntercomNotificationsAction()),
  initWalletConnect: () => dispatch(initWalletConnectSessions()),
  fetchAllAccountsBalances: () => dispatch(fetchAllAccountsBalancesAction()),
  checkForMissedAssets: () => dispatch(checkForMissedAssetsAction()),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
  removePrivateKeyFromMemory: () => dispatch(removePrivateKeyFromMemoryAction()),
  endWalkthrough: () => dispatch(endWalkthroughAction()),
  handleSystemDefaultThemeChange: () => dispatch(handleSystemDefaultThemeChangeAction()),
});

const ConnectedAppFlow = withTranslation()(connect(mapStateToProps, mapDispatchToProps)(AppFlow));
ConnectedAppFlow.router = AppFlowNavigation.router;
ConnectedAppFlow.defaultNavigationOptions = AppFlowNavigation.defaultNavigationOptions;

export default withTheme(ConnectedAppFlow);
