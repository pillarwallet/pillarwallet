// @flow
import * as React from 'react';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';
import { Toast } from 'native-base';
import { FluidNavigator } from 'react-navigation-fluid-transitions';
import { connect } from 'react-redux';
import { AppState, Animated, Easing, Image } from 'react-native';

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
import SendTokenConfirmScreen from 'screens/SendToken/SendTokenConfirm';
import HomeScreen from 'screens/Home';
import ChatListScreen from 'screens/Chat/ChatList';
import ChatScreen from 'screens/Chat/Chat';

// components
import RetryApiRegistration from 'components/RetryApiRegistration';

// actions
import { initAppAndRedirectAction, fetchUserAction } from 'actions/appActions';
import {
  stopListeningNotificationsAction,
  startListeningNotificationsAction,
  startListeningIntercomNotificationsAction,
  stopListeningIntercomNotificationsAction,
} from 'actions/notificationsActions';
import { fetchAssetsBalancesAction, fetchTransactionsHistoryAction } from 'actions/assetsActions';

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
  SEND_TOKEN_CONFIRM,
  SEND_TOKEN_FLOW,
  REVEAL_BACKUP_PHRASE,
  CHAT_LIST,
  CHAT,
} from 'constants/navigationConstants';
import { PENDING, REGISTERED } from 'constants/userConstants';

// models
import type { Assets } from 'models/Asset';

import { UIColors, baseColors } from 'utils/variables';

const SLEEP_TIMEOUT = 20000;
const BACKGROUND_APP_STATE = 'background';
const INACTIVE_APP_STATE = 'inactive';
const APP_LOGOUT_STATES = [BACKGROUND_APP_STATE, INACTIVE_APP_STATE];

const navigationOpts = {
  header: null,
};

const iconWallet = require('assets/icons/icon_wallet.png');
const iconPeople = require('assets/icons/icon_people.png');
const iconHome = require('assets/icons/icon_home.png');
const iconIco = require('assets/icons/icon_ico.png');
const iconChat = require('assets/icons/icon_chat.png');

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
}, StackNavigatorConfig);

const tabBarIcon = (icon) => ({ focused, tintColor }) => (
  <Image
    style={{
      width: 20,
      height: 20,
      tintColor: focused ? tintColor : baseColors.mediumGray,
    }}
    source={icon}
  />
);
// TAB NAVIGATION FLOW
const tabNavigation = createBottomTabNavigator(
  {
    [ASSETS]: {
      screen: assetsFlow,
      navigationOptions: () => ({
        tabBarIcon: tabBarIcon(iconWallet),
        tabBarLabel: 'Assets',
      }),
    },
    [PEOPLE]: {
      screen: peopleFlow,
      navigationOptions: () => ({
        tabBarIcon: tabBarIcon(iconPeople),
        tabBarLabel: 'People',
      }),
    },
    [HOME]: {
      screen: homeFlow,
      navigationOptions: () => ({
        tabBarIcon: tabBarIcon(iconHome),
        tabBarLabel: 'Home',
      }),
    },
    [ICO]: {
      screen: MarketplaceComingSoonScreen,
      navigationOptions: () => ({
        tabBarIcon: tabBarIcon(iconIco),
        tabBarLabel: 'Marketplace',
      }),
    },
    [CHAT_LIST]: {
      screen: chatFlow,
      navigationOptions: () => ({
        tabBarIcon: tabBarIcon(iconChat),
        tabBarLabel: 'Chat',
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
        height: 49,
      },
      labelStyle: {
        fontSize: 12,
        color: baseColors.mediumGray,
      },
    },
    tabBarPosition: 'bottom',
    animationEnabled: true,
    swipeEnabled: false,
  },
);

// SEND TOKEN FLOW
const sendTokenFlow = createStackNavigator({
  [SEND_TOKEN_AMOUNT]: SendTokenAmountScreen,
  [SEND_TOKEN_CONTACTS]: SendTokenContactsScreen,
  [SEND_TOKEN_CONFIRM]: SendTokenConfirmScreen,
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
    [SEND_TOKEN_FLOW]: sendTokenFlow,
    [CHANGE_PIN_FLOW]: changePinFlow,
    [REVEAL_BACKUP_PHRASE]: RevealBackupPhraseScreen,
    [CHAT]: ChatScreen,
  }, {
    mode: 'modal',
    navigationOptions: navigationOpts,
  },
);

type Props = {
  userState: ?string,
  fetchAppSettingsAndRedirect: Function,
  fetchUser: Function,
  startListeningNotifications: Function,
  stopListeningNotifications: Function,
  startListeningIntercomNotifications: Function,
  stopListeningIntercomNotifications: Function,
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  fetchTransactionsHistory: (walletAddress: string, asset: string) => Function,
  notifications: Object[],
  wallet: Object,
  assets: Object,
}

class AppFlow extends React.Component<Props, {}> {
  timer: any | TimeoutID;

  componentDidMount() {
    const {
      fetchUser,
      userState,
      startListeningNotifications,
      startListeningIntercomNotifications,
    } = this.props;
    if (userState !== REGISTERED) {
      fetchUser();
    }
    startListeningNotifications();
    startListeningIntercomNotifications();
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  componentDidUpdate(prevProps: Props) {
    const {
      notifications,
      fetchAssetsBalances,
      fetchTransactionsHistory,
      assets,
      wallet,
    } = this.props;
    const { notifications: prevNotifications } = prevProps;

    if (notifications.length !== prevNotifications.length) {
      const lastNotification = notifications[notifications.length - 1];

      Toast.show({
        text: lastNotification.message,
        buttonText: '',
      });

      fetchAssetsBalances(assets, wallet.address);
      fetchTransactionsHistory(wallet.address, lastNotification.asset);
    }
  }

  componentWillUnmount() {
    const { stopListeningNotifications, stopListeningIntercomNotifications } = this.props;
    stopListeningNotifications();
    stopListeningIntercomNotifications();
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  handleAppStateChange = (nextAppState: string) => {
    const { fetchAppSettingsAndRedirect } = this.props;
    clearTimeout(this.timer);
    if (APP_LOGOUT_STATES.indexOf(nextAppState) > -1) {
      this.timer = setTimeout(() => fetchAppSettingsAndRedirect(), SLEEP_TIMEOUT);
    }
  };

  render() {
    const { userState } = this.props;
    if (!userState) return null;
    if (userState === PENDING) {
      return <RetryApiRegistration />;
    }

    return <AppFlowNavigation />;
  }
}

const mapStateToProps = ({
  user: { userState },
  notifications: { data: notifications },
  assets: { data: assets },
  wallet: { data: wallet },
}) => ({
  userState,
  notifications,
  assets,
  wallet,
});

const mapDispatchToProps = (dispatch) => ({
  fetchAppSettingsAndRedirect: () => dispatch(initAppAndRedirectAction()),
  fetchUser: () => dispatch(fetchUserAction()),
  stopListeningNotifications: () => dispatch(stopListeningNotificationsAction()),
  startListeningNotifications: () => dispatch(startListeningNotificationsAction()),
  stopListeningIntercomNotifications: () => dispatch(stopListeningIntercomNotificationsAction()),
  startListeningIntercomNotifications: () => dispatch(startListeningIntercomNotificationsAction()),
  fetchAssetsBalances: (assets, walletAddress) => {
    dispatch(fetchAssetsBalancesAction(assets, walletAddress));
  },
  fetchTransactionsHistory: (walletAddress, asset) => {
    dispatch(fetchTransactionsHistoryAction(walletAddress, asset));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(AppFlow);
