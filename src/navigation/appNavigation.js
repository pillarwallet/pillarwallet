// @flow
import * as React from 'react';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';
import { FluidNavigator } from 'react-navigation-fluid-transitions';
import { connect } from 'react-redux';
import { showToast } from 'utils/toast';
import { AppState, Animated, Easing, Image, View, Platform } from 'react-native';
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
import SendTokenConfirmScreen from 'screens/SendToken/SendTokenConfirm';
import HomeScreen from 'screens/Home';
import ChatListScreen from 'screens/Chat/ChatList';
import ChatScreen from 'screens/Chat/Chat';

// components
import RetryApiRegistration from 'components/RetryApiRegistration';
import AndroidTabBarComponent from 'components/AndroidTabBarComponent';

// actions
import { initAppAndRedirectAction } from 'actions/appActions';
import {
  stopListeningNotificationsAction,
  startListeningNotificationsAction,
  startListeningIntercomNotificationsAction,
  stopListeningIntercomNotificationsAction,
} from 'actions/notificationsActions';
import { fetchInviteNotificationsAction } from 'actions/invitationsActions';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import {
  fetchTransactionsHistoryNotificationsAction,
  fetchTransactionsHistoryAction,
} from 'actions/historyActions';
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
  SEND_TOKEN_CONFIRM,
  SEND_TOKEN_FLOW,
  REVEAL_BACKUP_PHRASE,
  CHAT_LIST,
  CHAT,
} from 'constants/navigationConstants';
import { PENDING } from 'constants/userConstants';

// models
import type { Assets } from 'models/Asset';

import { UIColors, baseColors } from 'utils/variables';

const SLEEP_TIMEOUT = 20000;
const BACKGROUND_APP_STATE = 'background';
const INACTIVE_APP_STATE = 'inactive';
const APP_LOGOUT_STATES = [BACKGROUND_APP_STATE, INACTIVE_APP_STATE];

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
  [CONTACT]: ContactScreen,
}, StackNavigatorConfig);

const tabBarIcon = (icon, hasAddon) => ({ focused, tintColor }) => (
  <View style={{ padding: 4 }}>
    <Image
      style={{
        width: 18,
        height: 18,
        tintColor: focused ? tintColor : baseColors.mediumGray,
        resizeMode: 'contain',
      }}
      source={icon}
    />
    {!!hasAddon &&
      <View
        style={{
          width: 7,
          height: 7,
          backgroundColor: '#ffdb3c',
          borderRadius: 3.5,
          position: 'absolute',
          top: 0,
          right: 0,
        }}
      />}
  </View>
);

const tabBarLabel = (labelText) => ({ focused, tintColor }) => (
  <BaseText
    style={{
      fontSize: 12,
      color: focused ? tintColor : baseColors.mediumGray,
      textAlign: 'center',
    }}
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
        tabBarIcon: tabBarIcon(iconWallet),
        tabBarLabel: tabBarLabel('Assets'),
      }),
    },
    [PEOPLE]: {
      screen: peopleFlow,
      navigationOptions: () => ({
        tabBarIcon: tabBarIcon(iconPeople),
        tabBarLabel: tabBarLabel('People'),
      }),
    },
    [HOME]: {
      screen: homeFlow,
      navigationOptions: (props) => ({
        tabBarIcon: tabBarIcon(iconHome, props.screenProps.hasUnreadNotifications),
        tabBarLabel: tabBarLabel('Home'),
      }),
    },
    [ICO]: {
      screen: MarketplaceComingSoonScreen,
      navigationOptions: () => ({
        tabBarIcon: tabBarIcon(iconIco),
        tabBarLabel: tabBarLabel('Marketplace'),
      }),
    },
    [CHAT_LIST]: {
      screen: chatFlow,
      navigationOptions: () => ({
        tabBarIcon: tabBarIcon(iconChat),
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

// SEND TOKEN FLOW
const sendTokenFlow = createStackNavigator({
  [SEND_TOKEN_CONTACTS]: SendTokenContactsScreen,
  [SEND_TOKEN_AMOUNT]: SendTokenAmountScreen,
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
    navigationOptions: () => ({
      header: null,
    }),
    transitionConfig: () => ({
      transitionSpec: {
        duration: 400,
        easing: Easing.out(Easing.poly(2)),
        timing: Animated.timing,
      },
      screenInterpolator: sceneProps => {
        const { layout, position, scene } = sceneProps;
        const { index } = scene;

        const height = layout.initHeight;
        const translateY = position.interpolate({
          inputRange: [index - 1, index, index + 1],
          outputRange: [height, 0, 0],
        });

        const opacity = position.interpolate({
          inputRange: [index - 1, index - 0.99, index],
          outputRange: [0, 1, 1],
        });

        return { opacity, transform: [{ translateY }] };
      },
    }),
  },
);

type Props = {
  userState: ?string,
  fetchAppSettingsAndRedirect: Function,
  startListeningNotifications: Function,
  stopListeningNotifications: Function,
  startListeningIntercomNotifications: Function,
  stopListeningIntercomNotifications: Function,
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  fetchTransactionsHistory: (walletAddress: string) => Function,
  fetchTransactionsHistoryNotifications: Function,
  fetchInviteNotifications: Function,
  getExistingChats: Function,
  notifications: Object[],
  hasUnreadNotifications: boolean,
  wallet: Object,
  assets: Object,
}

class AppFlow extends React.Component<Props, {}> {
  timer: any | TimeoutID;

  componentDidMount() {
    const {
      startListeningNotifications,
      startListeningIntercomNotifications,
      fetchTransactionsHistory,
      fetchInviteNotifications,
      fetchTransactionsHistoryNotifications,
      fetchAssetsBalances,
      getExistingChats,
      assets,
      wallet,
    } = this.props;
    startListeningNotifications();
    startListeningIntercomNotifications();
    fetchTransactionsHistory(wallet.address);
    fetchAssetsBalances(assets, wallet.address);
    fetchInviteNotifications();
    fetchTransactionsHistoryNotifications();
    getExistingChats();
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  componentDidUpdate(prevProps: Props) {
    const {
      notifications,
    } = this.props;
    const { notifications: prevNotifications } = prevProps;

    if (notifications.length !== prevNotifications.length) {
      const lastNotification = notifications[notifications.length - 1];
      showToast({ text: lastNotification.message });
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

    return <AppFlowNavigation screenProps={{ hasUnreadNotifications: this.props.hasUnreadNotifications }} />;
  }
}

const mapStateToProps = ({
  user: { userState },
  notifications: { data: notifications, hasUnreadNotifications },
  assets: { data: assets },
  wallet: { data: wallet },
}) => ({
  userState,
  notifications,
  hasUnreadNotifications,
  assets,
  wallet,
});

const mapDispatchToProps = (dispatch) => ({
  fetchAppSettingsAndRedirect: () => dispatch(initAppAndRedirectAction()),
  stopListeningNotifications: () => dispatch(stopListeningNotificationsAction()),
  startListeningNotifications: () => dispatch(startListeningNotificationsAction()),
  stopListeningIntercomNotifications: () => dispatch(stopListeningIntercomNotificationsAction()),
  startListeningIntercomNotifications: () => dispatch(startListeningIntercomNotificationsAction()),
  fetchAssetsBalances: (assets, walletAddress) => {
    dispatch(fetchAssetsBalancesAction(assets, walletAddress));
  },
  fetchTransactionsHistory: (walletAddress) => {
    dispatch(fetchTransactionsHistoryAction(walletAddress));
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
