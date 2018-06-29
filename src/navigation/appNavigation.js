// @flow
import * as React from 'react';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';
import { Toast } from 'native-base';
import { FluidNavigator } from 'react-navigation-fluid-transitions';
import { connect } from 'react-redux';
import { AppState, Animated, Easing, Platform, Image } from 'react-native';


// screens
import AddTokenScreen from 'screens/AddToken';
import AssetsScreen from 'screens/Assets';
import AssetScreen from 'screens/Asset';
import ICOScreen from 'screens/ICO';
import ProfileScreen from 'screens/Profile';
import ChangePinCurrentPinScreen from 'screens/ChangePin/CurrentPin';
import ChangePinNewPinScreen from 'screens/ChangePin/NewPin';
import ChangePinConfirmNewPinScreen from 'screens/ChangePin/ConfirmNewPin';
import RevealBackupPhraseScreen from 'screens/RevealBackupPhrase';
import SendTokenAmountScreen from 'screens/SendToken/SendTokenAmount';
import SendTokenContactsScreen from 'screens/SendToken/SendTokenContacts';
import SendTokenConfirmScreen from 'screens/SendToken/SendTokenConfirm';

// components
import RetryApiRegistration from 'components/RetryApiRegistration';

// actions
import { initAppAndRedirectAction, fetchUserAction } from 'actions/appActions';
import { stopListeningNotificationsAction, startListeningNotificationsAction } from 'actions/notificationsActions';
import { fetchAssetsBalancesAction, fetchTransactionsHistoryAction } from 'actions/assetsActions';

// constants
import {
  ADD_TOKEN,
  ASSETS,
  ASSET,
  ICO,
  PROFILE,
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
} from 'constants/navigationConstants';
import { PENDING, REGISTERED } from 'constants/userConstants';

// models
import type { Assets } from 'models/Asset';

import { UIColors, baseColors } from 'utils/variables';

const SLEEP_TIMEOUT = 20000;
const BACKGROUND_APP_STATE = 'background';
const INACTIVE_APP_STATE = 'inactive';
const APP_LOGOUT_STATES = [BACKGROUND_APP_STATE, INACTIVE_APP_STATE];

// NAVIGATION OPTIONS FOR ANDROID AND IOS
let navigationOpts;

if (Platform.OS === 'ios') {
  navigationOpts = {
    header: null,
  };
} else {
  navigationOpts = {
    headerStyle: {
      borderBottomWidth: 0,
      elevation: 0,
      height: 0,
    },
  };
}

const iconWallet = require('assets/icons/icon_wallet.png');
const iconProfile = require('assets/icons/icon_profile.png');
const iconIco = require('assets/icons/icon_ico.png');

const StackNavigatorModalConfig = {
  mode: 'modal',
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

// ASSETS FLOW
const assetsFlow = FluidNavigator({
  [ASSETS]: AssetsScreen,
  [ASSET]: AssetScreen,
}, FluidNavigatorConfig);

// TAB NAVIGATION FLOW
const tabNavigation = createBottomTabNavigator(
  {
    [ASSETS]: {
      screen: assetsFlow,
      navigationOptions: () => ({
        tabBarIcon: ({ focused, tintColor }) => (
          <Image
            style={{
            width: 22,
            height: 22,
            tintColor: focused ? tintColor : baseColors.mediumGray,
          }}
            source={iconWallet}
          />
        ),
        tabBarLabel: 'Assets',
      }),
    },
    [ICO]: {
      screen: ICOScreen,
      navigationOptions: () => ({
        tabBarIcon: ({ focused, tintColor }) => (
          <Image
            style={{
              width: 22,
              height: 22,
              tintColor: focused ? tintColor : baseColors.mediumGray,
            }}
            source={iconIco}
          />
        ),
        tabBarLabel: 'Ico marketplace',
      }),
    },
    [PROFILE]: {
      screen: ProfileScreen,
      navigationOptions: () => ({
        tabBarIcon: ({ focused, tintColor }) => (
          <Image
            style={{
              width: 22,
              height: 22,
              tintColor: focused ? tintColor : baseColors.mediumGray,
            }}
            source={iconProfile}
          />
        ),
        tabBarLabel: 'Profile',
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
        height: 66,
      },
      labelStyle: {
        fontSize: 14,
        marginBottom: 4,
        marginTop: 4,
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

const changePinFlow = createStackNavigator(
  {
    [CHANGE_PIN_CURRENT_PIN]: ChangePinCurrentPinScreen,
    [CHANGE_PIN_NEW_PIN]: ChangePinNewPinScreen,
    [CHANGE_PIN_CONFIRM_NEW_PIN]: ChangePinConfirmNewPinScreen,
  }, {
    navigationOptions: {
      header: null,
    },
  },
);

// APP NAVIGATION FLOW
const AppFlowNavigation = createStackNavigator(
  {
    [TAB_NAVIGATION]: tabNavigation,
    [ADD_TOKEN]: AddTokenScreen,
    [SEND_TOKEN_FLOW]: sendTokenFlow,
    [CHANGE_PIN_FLOW]: changePinFlow,
    [REVEAL_BACKUP_PHRASE]: RevealBackupPhraseScreen,
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
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  fetchTransactionsHistory: (walletAddress: string, asset: string) => Function,
  notifications: Object[],
  wallet: Object,
  assets: Object,
}

class AppFlow extends React.Component<Props, {}> {
  timer: any | TimeoutID;

  componentDidMount() {
    const { fetchUser, userState, startListeningNotifications } = this.props;
    if (userState !== REGISTERED) {
      fetchUser();
    }
    startListeningNotifications();
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
    const { stopListeningNotifications } = this.props;
    stopListeningNotifications();
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
  fetchAssetsBalances: (assets, walletAddress) => {
    dispatch(fetchAssetsBalancesAction(assets, walletAddress));
  },
  fetchTransactionsHistory: (walletAddress, asset) => {
    dispatch(fetchTransactionsHistoryAction(walletAddress, asset));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(AppFlow);
