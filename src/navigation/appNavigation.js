// @flow
import * as React from 'react';
import {
  createStackNavigator,
  createBottomTabNavigator,
} from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';
import BackgroundTimer from 'react-native-background-timer';
import { FluidNavigator } from 'react-navigation-fluid-transitions';
import { connect } from 'react-redux';
import { AppState, Animated, Easing, View, Platform, Image, DeviceEventEmitter } from 'react-native';
import { BaseText } from 'components/Typography';

// screens
import AddTokenScreen from 'screens/AddToken';
import AssetsScreen from 'screens/Assets';
import AssetScreen from 'screens/Asset';
import MarketplaceComingSoonScreen from 'screens/MarketplaceComingSoon';
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
import HomeScreen from 'screens/Home';
import ChatListScreen from 'screens/Chat/ChatList';
import NewChatListScreen from 'screens/Chat/NewChatList';
import ChatScreen from 'screens/Chat/Chat';

// components
import RetryApiRegistration from 'components/RetryApiRegistration';
import AndroidTabBarComponent from 'components/AndroidTabBarComponent';
import Toast from 'components/Toast';

import {
  stopListeningNotificationsAction,
  startListeningNotificationsAction,
  startListeningIntercomNotificationsAction,
  stopListeningIntercomNotificationsAction,
} from 'actions/notificationsActions';
import { fetchInviteNotificationsAction } from 'actions/invitationsActions';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchTransactionsHistoryNotificationsAction } from 'actions/historyActions';
import { getExistingChatsAction } from 'actions/chatActions';

// constants
import {
  ADD_TOKEN,
  ASSETS,
  ASSET,
  ICO,
  PROFILE,
  PEOPLE,
  CONTACT,
  HOME,
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
  CHAT_LIST,
  NEW_CHAT,
  CHAT,
  AUTH_FLOW,
} from 'constants/navigationConstants';
import { PENDING } from 'constants/userConstants';

// models
import type { Assets } from 'models/Asset';

import { UIColors, baseColors, fontSizes } from 'utils/variables';
import { modalTransition } from 'utils/common';

const SLEEP_TIMEOUT = 20000;
const BACKGROUND_APP_STATE = 'background';
const APP_LOGOUT_STATES = [BACKGROUND_APP_STATE];

const addAppStateChangeListener = (callback) => {
  return Platform.OS === 'ios'
    ? AppState.addEventListener('change', callback)
    : DeviceEventEmitter.addListener('ActivityStateChange', callback);
};

const removeAppStateChangeListener = (callback) => {
  return Platform.OS === 'ios'
    ? AppState.removeEventListener('change', callback)
    : DeviceEventEmitter.removeListener('ActivityStateChange', callback);
};

const iconWallet = require('assets/icons/icon_wallet.png');
const iconPeople = require('assets/icons/icon_people.png');
const iconHome = require('assets/icons/icon_home.png');
const iconIco = require('assets/icons/icon_marketplace.png');
const iconChat = require('assets/icons/icon_chat.png');
const iconWalletActive = require('assets/icons/icon_wallet_active.png');
const iconPeopleActive = require('assets/icons/icon_people_active.png');
const iconHomeActive = require('assets/icons/icon_home_active.png');
const iconIcoActive = require('assets/icons/icon_marketplace_active.png');
const iconChatActive = require('assets/icons/icon_chat_active.png');

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

const FluidNavigatorConfig = {
  navigationOptions: {
    header: null,
    gesturesEnabled: false,
  },
};

const StackNavigatorConfig = {
  navigationOptions: {
    header: null,
    gesturesEnabled: false,
  },
};

// CHAT FLOW
const chatFlow = createStackNavigator({
  [CHAT_LIST]: ChatListScreen,
  [NEW_CHAT]: NewChatListScreen,
}, StackNavigatorConfig);

// ASSETS FLOW
const assetsFlow = FluidNavigator({
  [ASSETS]: AssetsScreen,
  [ASSET]: AssetScreen,
}, FluidNavigatorConfig);

// PEOPLE FLOW
const peopleFlow = createStackNavigator({
  [PEOPLE]: PeopleScreen,
  [CONTACT]: ContactScreen,
  [CONNECTION_REQUESTS]: ConnectionRequestsScreen,
}, StackNavigatorConfig);

// HOME FLOW
const homeFlow = createStackNavigator({
  [HOME]: HomeScreen,
  [PROFILE]: ProfileScreen,
  [CONTACT]: ContactScreen,
}, StackNavigatorConfig);

const tabBarIcon = (iconActive, icon, hasAddon) => ({ focused }) => (
  <View style={{ padding: 4 }}>
    <Image
      style={{
        width: 24,
        height: 24,
        resizeMode: 'contain',
      }}
      source={focused ? iconActive : icon}
    />
    {!!hasAddon &&
      <View
        style={{
          width: 8,
          height: 8,
          backgroundColor: baseColors.sunYellow,
          borderRadius: 4,
          position: 'absolute',
          top: 4,
          right: 4,
        }}
      />}
  </View>
);

const tabBarLabel = (labelText) => ({ focused, tintColor }) => (
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
      navigationOptions: () => ({
        tabBarIcon: tabBarIcon(iconPeopleActive, iconPeople),
        tabBarLabel: tabBarLabel('People'),
      }),
    },
    [HOME]: {
      screen: homeFlow,
      navigationOptions: ({ navigation, screenProps }) => ({
        tabBarIcon: tabBarIcon(
          iconHomeActive,
          iconHome,
          !navigation.isFocused() && (screenProps.hasUnreadNotifications || !!screenProps.intercomNotificationsCount)),
        tabBarLabel: tabBarLabel('Home'),
      }),
    },
    [ICO]: {
      screen: MarketplaceComingSoonScreen,
      navigationOptions: () => ({
        tabBarIcon: tabBarIcon(iconIcoActive, iconIco),
        tabBarLabel: tabBarLabel('Market'),
      }),
    },
    [CHAT_LIST]: {
      screen: chatFlow,
      navigationOptions: ({ navigation, screenProps }) => ({
        tabBarIcon:
          tabBarIcon(
            iconChatActive,
            iconChat,
            !navigation.isFocused() && screenProps.hasUnreadChatNotifications),

        tabBarLabel: tabBarLabel('Chat'),
      }),
    },
  }, {
    tabBarOptions: {
      activeTintColor: UIColors.primary,
      inactiveTintColor: 'gray',
      activeBackgroundColor: 'white',
      inactiveBackgroundColor: 'white',
      style: {
        backgroundColor: 'white',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        borderTopColor: 'transparent',
        paddingTop: 5,
        paddingBottom: 5,
        height: 54,
      },
    },
    tabBarPosition: 'bottom',
    animationEnabled: true,
    swipeEnabled: false,
    ...generateCustomBottomBar(),
  },
);

// SEND TOKEN FROM ASSET FLOW
const sendTokenFromAssetFlow = createStackNavigator({
  [SEND_TOKEN_CONTACTS]: SendTokenContactsScreen,
  [SEND_TOKEN_AMOUNT]: SendTokenAmountScreen,
  [SEND_TOKEN_CONFIRM]: SendTokenConfirmScreen,
  [SEND_TOKEN_PIN_CONFIRM]: SendTokenPinConfirmScreen,
  [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
}, StackNavigatorModalConfig);

// SEND TOKEN FROM CONTACT FLOW
const sendTokenFromContactFlow = createStackNavigator({
  [SEND_TOKEN_ASSETS]: SendTokenAssetsScreen,
  [SEND_TOKEN_AMOUNT]: SendTokenAmountScreen,
  [SEND_TOKEN_CONFIRM]: SendTokenConfirmScreen,
  [SEND_TOKEN_PIN_CONFIRM]: SendTokenPinConfirmScreen,
  [SEND_TOKEN_TRANSACTION]: SendTokenTransactionScreen,
}, StackNavigatorModalConfig);

const changePinFlow = createStackNavigator({
  [CHANGE_PIN_CURRENT_PIN]: ChangePinCurrentPinScreen,
  [CHANGE_PIN_NEW_PIN]: ChangePinNewPinScreen,
  [CHANGE_PIN_CONFIRM_NEW_PIN]: ChangePinConfirmNewPinScreen,
}, StackNavigatorModalConfig);


// APP NAVIGATION FLOW
const AppFlowNavigation = createStackNavigator(
  {
    [TAB_NAVIGATION]: tabNavigation,
    [ADD_TOKEN]: AddTokenScreen,
    [SEND_TOKEN_FROM_ASSET_FLOW]: sendTokenFromAssetFlow,
    [SEND_TOKEN_FROM_CONTACT_FLOW]: sendTokenFromContactFlow,
    [CHANGE_PIN_FLOW]: changePinFlow,
    [REVEAL_BACKUP_PHRASE]: RevealBackupPhraseScreen,
    [CHAT]: ChatScreen,
  }, modalTransition,
);

type Props = {
  userState: ?string,
  fetchAppSettingsAndRedirect: Function,
  startListeningNotifications: Function,
  stopListeningNotifications: Function,
  startListeningIntercomNotifications: Function,
  stopListeningIntercomNotifications: Function,
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  fetchTransactionsHistoryNotifications: Function,
  fetchInviteNotifications: Function,
  getExistingChats: Function,
  notifications: Object[],
  hasUnreadNotifications: boolean,
  hasUnreadChatNotifications: boolean,
  intercomNotificationsCount: number,
  navigation: NavigationScreenProp<*>,
  wallet: Object,
  assets: Object,
}

let lockTimer;

class AppFlow extends React.Component<Props, {}> {
  componentDidMount() {
    const {
      startListeningNotifications,
      startListeningIntercomNotifications,
      fetchInviteNotifications,
      fetchTransactionsHistoryNotifications,
      fetchAssetsBalances,
      getExistingChats,
      assets,
      wallet,
    } = this.props;
    startListeningNotifications();
    startListeningIntercomNotifications();
    fetchAssetsBalances(assets, wallet.address);
    fetchInviteNotifications();
    fetchTransactionsHistoryNotifications();
    getExistingChats();
    addAppStateChangeListener(this.handleAppStateChange);
  }

  componentDidUpdate(prevProps: Props) {
    const {
      notifications,
    } = this.props;
    const { notifications: prevNotifications } = prevProps;

    if (notifications.length !== prevNotifications.length) {
      const lastNotification = notifications[notifications.length - 1];
      Toast.show({ message: lastNotification.message, type: 'info', title: 'Notification' });
    }
  }

  componentWillUnmount() {
    const { stopListeningNotifications, stopListeningIntercomNotifications } = this.props;
    stopListeningNotifications();
    stopListeningIntercomNotifications();
    removeAppStateChangeListener(this.handleAppStateChange);
  }

  handleAppStateChange = (nextAppState: string) => {
    const {
      stopListeningNotifications,
      stopListeningIntercomNotifications,
      navigation,
    } = this.props;
    BackgroundTimer.clearTimeout(lockTimer);
    if (APP_LOGOUT_STATES.includes(nextAppState)) {
      lockTimer = BackgroundTimer.setTimeout(() => {
        navigation.navigate(AUTH_FLOW);
        stopListeningNotifications();
        stopListeningIntercomNotifications();
      }, SLEEP_TIMEOUT);
    }
  };

  render() {
    const {
      userState,
      hasUnreadNotifications,
      intercomNotificationsCount,
      hasUnreadChatNotifications,
    } = this.props;
    if (!userState) return null;
    if (userState === PENDING) {
      return <RetryApiRegistration />;
    }

    return (
      <AppFlowNavigation screenProps={{
        hasUnreadNotifications,
        hasUnreadChatNotifications,
        intercomNotificationsCount,
      }}
      />
    );
  }
}

const mapStateToProps = ({
  user: { userState },
  notifications: {
    data: notifications,
    intercomNotificationsCount,
    hasUnreadNotifications,
    hasUnreadChatNotifications,
  },
  assets: { data: assets },
  wallet: { data: wallet },
}) => ({
  userState,
  notifications,
  hasUnreadNotifications,
  assets,
  wallet,
  hasUnreadChatNotifications,
  intercomNotificationsCount,
});

const mapDispatchToProps = (dispatch) => ({
  stopListeningNotifications: () => dispatch(stopListeningNotificationsAction()),
  startListeningNotifications: () => dispatch(startListeningNotificationsAction()),
  stopListeningIntercomNotifications: () => dispatch(stopListeningIntercomNotificationsAction()),
  startListeningIntercomNotifications: () => dispatch(startListeningIntercomNotificationsAction()),
  fetchAssetsBalances: (assets, walletAddress) => {
    dispatch(fetchAssetsBalancesAction(assets, walletAddress));
  },
  fetchTransactionsHistoryNotifications: () => {
    dispatch(fetchTransactionsHistoryNotificationsAction());
  },
  fetchInviteNotifications: () => {
    dispatch(fetchInviteNotificationsAction());
  },
  getExistingChats: () => dispatch(getExistingChatsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(AppFlow);
