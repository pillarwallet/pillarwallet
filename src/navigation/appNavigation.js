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
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';
import BackgroundTimer from 'react-native-background-timer';
import { connect } from 'react-redux';
import { Animated, Easing, View, Platform, Image } from 'react-native';
import { BaseText } from 'components/Typography';
// import ProfileImage from 'components/ProfileImage/ProfileImage';

// services
import { updateNavigationLastScreenState } from 'services/navigation';

// screens
import AddTokenScreen from 'screens/AddToken';
import AssetsScreen from 'screens/Assets';
import AssetScreen from 'screens/Asset';
import ProfileScreen from 'screens/Profile';
import PeopleScreen from 'screens/People';
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
import SendCollectibleConfirmScreen from 'screens/SendCollectible/SendCollectibleConfirm';
import HomeScreen from 'screens/Home';
import MeScreen from 'screens/Me';
import ParticipateScreen from 'screens/Participate';
import InstructionsScreen from 'screens/Participate/Instructions';
import ConfirmScreen from 'screens/Participate/Confirm';
import BackupPhraseScreen from 'screens/BackupPhrase';
import BackupPhraseValidateScreen from 'screens/BackupPhraseValidate';
import CollectibleScreen from 'screens/Collectible';
import WalletConnectSessionRequest from 'screens/WalletConnect/WalletConnectSessionRequest';
import WalletConnectCallRequest from 'screens/WalletConnect/WalletConnectCallRequest';
import WalletConnectPinConfirm from 'screens/WalletConnect/WalletConnectPinConfirm';
import BadgeScreen from 'screens/Badge';
import OTPScreen from 'screens/OTP';
import ContactInfo from 'screens/ContactInfo';
import ConfirmClaimScreen from 'screens/Referral/ConfirmClaimScreen';
import ManageDetailsSessionsScreen from 'screens/ManageDetailsSessions';

// components
import RetryApiRegistration from 'components/RetryApiRegistration';
import AndroidTabBarComponent from 'components/AndroidTabBarComponent';
import Toast from 'components/Toast';

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
import { fetchTransactionsHistoryNotificationsAction } from 'actions/historyActions';
import { getExistingChatsAction } from 'actions/chatActions';
import { fetchICOsAction } from 'actions/icosActions';
import { updateSignalInitiatedStateAction } from 'actions/sessionActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import { removePrivateKeyFromMemoryAction } from 'actions/walletActions';

// constants
import {
  ADD_TOKEN,
  ME,
  // ME_TAB,
  ASSETS,
  ASSET,
  PROFILE,
  PEOPLE,
  CONTACT,
  HOME,
  HOME_TAB,
  CONNECTION_REQUESTS,
  CHANGE_PIN_FLOW,
  CHANGE_PIN_CURRENT_PIN,
  CHANGE_PIN_NEW_PIN,
  CHANGE_PIN_CONFIRM_NEW_PIN,
  TAB_NAVIGATION,
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
  PARTICIPATE_IN_ICO_FLOW,
  ICO_PARTICIPATE,
  ICO_INSTRUCTIONS,
  ICO_CONFIRM,
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
  MANAGE_DETAILS_SESSIONS,
  CONTACT_INFO,
} from 'constants/navigationConstants';
import { PENDING, REGISTERED } from 'constants/userConstants';

import { TYPE_CANCELLED, TYPE_BLOCKED, TYPE_REJECTED, TYPE_DISCONNECTED } from 'constants/invitationsConstants';

// models
import type { Assets } from 'models/Asset';

// utils
import { UIColors, baseColors, fontSizes } from 'utils/variables';
import { initWalletConnectSessions } from 'actions/walletConnectActions';
import { modalTransition, addAppStateChangeListener, removeAppStateChangeListener } from 'utils/common';

const SLEEP_TIMEOUT = 20000;
const BACKGROUND_APP_STATE = 'background';
const APP_LOGOUT_STATES = [BACKGROUND_APP_STATE];

const iconWallet = require('assets/icons/icon_wallet_new.png');
const iconPeople = require('assets/icons/icon_people_group.png');
// const iconMe = require('assets/icons/icon_me.png');
const iconHome = require('assets/icons/icon_home_new.png');
const iconWalletActive = require('assets/icons/icon_wallet_active.png');
const iconPeopleActive = require('assets/icons/icon_people_group_active.png');
// const iconMeActive = require('assets/icons/icon_me_active.png');
const iconHomeActive = require('assets/icons/icon_home_active.png');

const connectionMessagesToExclude = [TYPE_CANCELLED, TYPE_BLOCKED, TYPE_REJECTED, TYPE_DISCONNECTED];

const StackNavigatorModalConfig = {
  transitionConfig: () => ({
    transitionSpec: {
      duration: 0,
      timing: Animated.timing,
      easing: Easing.step0,
    },
  }),
  navigationOptions: {
    header: null,
  },
};

const StackNavigatorConfig = {
  navigationOptions: {
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
  },
  StackNavigatorConfig,
);

assetsFlow.navigationOptions = hideTabNavigatorOnChildView;

// ME FLOW
const meFlow = createStackNavigator({
  [ME]: MeScreen,
  [MANAGE_DETAILS_SESSIONS]: ManageDetailsSessionsScreen,
}, StackNavigatorConfig);

meFlow.navigationOptions = hideTabNavigatorOnChildView;

// PEOPLE FLOW
const peopleFlow = createStackNavigator({
  [PEOPLE]: PeopleScreen,
  [CONTACT]: ContactScreen,
  [CONNECTION_REQUESTS]: ConnectionRequestsScreen,
  [COLLECTIBLE]: CollectibleScreen,
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
  [PROFILE]: ProfileScreen,
  [OTP]: OTPScreen,
  [CONTACT_INFO]: ContactInfo,
  [CONFIRM_CLAIM]: ConfirmClaimScreen,
  [CONTACT]: ContactScreen,
  [COLLECTIBLE]: CollectibleScreen,
  [BADGE]: BadgeScreen,
}, StackNavigatorConfig);

homeFlow.navigationOptions = hideTabNavigatorOnChildView;

const tabBarIcon = (iconActive, icon, hasAddon, warningNotification = false) => ({ focused }) => {
  const notificationColor = warningNotification ? baseColors.burningFire : baseColors.sunYellow;

  return (
    <View style={{ padding: 4 }}>
      <Image
        style={{
          width: 24,
          height: 24,
        }}
        resizeMode="contain"
        source={focused ? iconActive : icon}
      />
      {!!hasAddon && (
        <View
          style={{
            width: 8,
            height: 8,
            backgroundColor: notificationColor,
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

// const tabBarImage = (image) => ({ focused }) => {
//   return (
//     <View style={{ padding: 4 }}>
//       <ProfileImage
//         noShadow
//         borderWidth={2}
//         borderColor={focused ? baseColors.electricBlue : baseColors.white}
//         borderSpacing={1}
//         initialsSize={10}
//         diameter={24}
//         uri={image}
//       />
//     </View>
//   );
// };

const tabBarLabel = labelText => ({ focused, tintColor }) => (
  <BaseText
    style={{
      fontSize: fontSizes.extraExtraSmall,
      color: focused ? tintColor : baseColors.mediumGray,
      textAlign: 'center',
    }}
    numberOfLines={1}
  >
    {labelText}
  </BaseText>
);

// TAB NAVIGATION FLOW
const generateCustomBottomBar = (): Object => {
  if (Platform.OS !== 'android') {
    return {};
  }

  return {
    tabBarComponent: props => <AndroidTabBarComponent {...props} />,
    tabBarPosition: 'bottom',
  };
};

const tabNavigation = createBottomTabNavigator(
  {
    [ASSETS]: {
      screen: assetsFlow,
      navigationOptions: () => ({
        tabBarIcon: tabBarIcon(iconWalletActive, iconWallet),
        tabBarLabel: tabBarLabel('Assets'),
      }),
    },
    [PEOPLE]: {
      screen: peopleFlow,
      navigationOptions: ({ navigation, screenProps }) => ({
        tabBarIcon: tabBarIcon(
          iconPeopleActive,
          iconPeople,
          !navigation.isFocused() && screenProps.hasUnreadChatNotifications),
        tabBarLabel: tabBarLabel('People'),
      }),
    },
    [HOME_TAB]: {
      screen: homeFlow,
      navigationOptions: ({ navigation, screenProps }) => ({
        tabBarIcon: tabBarIcon(
          iconHomeActive,
          iconHome,
          !screenProps.isWalletBackedUp ||
            (!navigation.isFocused() &&
              (screenProps.hasUnreadNotifications || !!screenProps.intercomNotificationsCount)),
          !screenProps.isWalletBackedUp,
        ),
        tabBarLabel: tabBarLabel('Home'),
      }),
    },
    // [ME_TAB]: {
    //   screen: meFlow,
    //   navigationOptions: ({ screenProps }) => ({
    //     tabBarIcon: screenProps.profileImage
    //       ? tabBarImage(screenProps.profileImage)
    //       : tabBarIcon(iconMeActive, iconMe),
    //     tabBarLabel: tabBarLabel('Me'),
    //   }),
    // },
  }, {
    tabBarOptions: {
      activeTintColor: UIColors.primary,
      inactiveTintColor: 'gray',
      activeBackgroundColor: 'white',
      inactiveBackgroundColor: 'white',
      style: {
        backgroundColor: 'white',
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
    ...generateCustomBottomBar(),
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

// PARTICIPATE IN ICO FLOW
const participateInICOFlow = createStackNavigator(
  {
    [ICO_PARTICIPATE]: ParticipateScreen,
    [ICO_INSTRUCTIONS]: InstructionsScreen,
    [ICO_CONFIRM]: ConfirmScreen,
  },
  StackNavigatorModalConfig,
);

// WALLET BACKUP IN SETTINGS FLOW
const backupWalletFlow = createStackNavigator(
  {
    [BACKUP_PHRASE]: BackupPhraseScreen,
    [BACKUP_PHRASE_VALIDATE]: BackupPhraseValidateScreen,
  },
  StackNavigatorModalConfig,
);

// APP NAVIGATION FLOW
const AppFlowNavigation = createStackNavigator(
  {
    [TAB_NAVIGATION]: tabNavigation,
    [ADD_TOKEN]: AddTokenScreen,
    [SEND_TOKEN_FROM_ASSET_FLOW]: sendTokenFromAssetFlow,
    [SEND_TOKEN_FROM_CONTACT_FLOW]: sendTokenFromContactFlow,
    [SEND_COLLECTIBLE_FROM_ASSET_FLOW]: sendCollectibleFromAssetFlow,
    [PARTICIPATE_IN_ICO_FLOW]: participateInICOFlow,
    [CHANGE_PIN_FLOW]: changePinFlow,
    [REVEAL_BACKUP_PHRASE]: RevealBackupPhraseScreen,
    [BACKUP_WALLET_IN_SETTINGS_FLOW]: backupWalletFlow,
    [WALLETCONNECT_FLOW]: walletConnectFlow,
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
  fetchICOs: Function,
  fetchAssetsBalances: (assets: Assets) => Function,
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
  assets: Object,
  isPickingImage: boolean,
  updateSignalInitiatedState: Function,
  fetchAllCollectiblesData: Function,
  removePrivateKeyFromMemory: Function,
}

let lockTimer;

class AppFlow extends React.Component<Props, {}> {
  componentDidMount() {
    const {
      startListeningNotifications,
      startListeningIntercomNotifications,
      startListeningChatWebSocket,
      fetchInviteNotifications,
      fetchTransactionsHistoryNotifications,
      fetchAssetsBalances,
      fetchICOs,
      getExistingChats,
      assets,
      fetchAllCollectiblesData,
      initWalletConnect,
    } = this.props;
    startListeningNotifications();
    startListeningIntercomNotifications();
    fetchAssetsBalances(assets);
    fetchInviteNotifications();
    fetchTransactionsHistoryNotifications();
    fetchICOs();
    getExistingChats();
    fetchAllCollectiblesData();
    startListeningChatWebSocket();
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

    if (notifications.length !== prevNotifications.length) {
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
    } = this.props;
    stopListeningNotifications();
    stopListeningIntercomNotifications();
    stopListeningChatWebSocket();
    updateSignalInitiatedState(false);
    removeAppStateChangeListener(this.handleAppStateChange);
  }

  handleAppStateChange = (nextAppState: string) => {
    const {
      stopListeningNotifications,
      stopListeningIntercomNotifications,
      stopListeningChatWebSocket,
      updateSignalInitiatedState,
      navigation,
      isPickingImage,
    } = this.props;
    BackgroundTimer.clearTimeout(lockTimer);
    if (APP_LOGOUT_STATES.includes(nextAppState) && !isPickingImage) {
      lockTimer = BackgroundTimer.setTimeout(() => {
        const pathAndParams = navigation.router.getPathAndParamsForState(navigation.state);
        const lastActiveScreen = pathAndParams.path.split('/').slice(-1)[0];
        const lastActiveScreenParams = pathAndParams.params;
        updateNavigationLastScreenState({ lastActiveScreen, lastActiveScreenParams });
        navigation.navigate(AUTH_FLOW);
        stopListeningNotifications();
        stopListeningIntercomNotifications();
        stopListeningChatWebSocket();
        updateSignalInitiatedState(false);
      }, SLEEP_TIMEOUT);
    }
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
  assets: { data: assets },
  wallet: { data: wallet, backupStatus },
  appSettings: {
    data: { isPickingImage },
  },
}) => ({
  profileImage,
  userState,
  notifications,
  hasUnreadNotifications,
  assets,
  wallet,
  backupStatus,
  hasUnreadChatNotifications,
  intercomNotificationsCount,
  isPickingImage,
});

const mapDispatchToProps = dispatch => ({
  stopListeningNotifications: () => dispatch(stopListeningNotificationsAction()),
  startListeningNotifications: () => dispatch(startListeningNotificationsAction()),
  stopListeningIntercomNotifications: () => dispatch(stopListeningIntercomNotificationsAction()),
  startListeningIntercomNotifications: () => dispatch(startListeningIntercomNotificationsAction()),
  stopListeningChatWebSocket: () => dispatch(stopListeningChatWebSocketAction()),
  startListeningChatWebSocket: () => dispatch(startListeningChatWebSocketAction()),
  initWalletConnect: () => dispatch(initWalletConnectSessions()),
  fetchAssetsBalances: (assets) => dispatch(fetchAssetsBalancesAction(assets)),
  fetchTransactionsHistoryNotifications: () => {
    dispatch(fetchTransactionsHistoryNotificationsAction());
  },
  fetchInviteNotifications: () => {
    dispatch(fetchInviteNotificationsAction());
  },
  getExistingChats: () => dispatch(getExistingChatsAction()),
  fetchICOs: () => dispatch(fetchICOsAction()),
  updateSignalInitiatedState: signalState => dispatch(updateSignalInitiatedStateAction(signalState)),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
  removePrivateKeyFromMemory: () => dispatch(removePrivateKeyFromMemoryAction()),
});

const ConnectedAppFlow = connect(
  mapStateToProps,
  mapDispatchToProps,
)(AppFlow);
ConnectedAppFlow.router = AppFlowNavigation.router;
ConnectedAppFlow.navigationOptions = AppFlowNavigation.navigationOptions;

export default ConnectedAppFlow;
