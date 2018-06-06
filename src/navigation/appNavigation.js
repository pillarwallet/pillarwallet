// @flow
import * as React from 'react';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';
import { FluidNavigator } from 'react-navigation-fluid-transitions';
import { connect } from 'react-redux';
import { AppState, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// screens
import AddTokenScreen from 'screens/AddToken';
import AssetsScreen from 'screens/Assets';
import AssetScreen from 'screens/Asset';
import ICOScreen from 'screens/ICO';
import ProfileScreen from 'screens/Profile';
import ChangePinCurrentPinScreen from 'screens/ChangePin/CurrentPin';
import ChangePinNewPinScreen from 'screens/ChangePin/NewPin';
import ChangePinConfirmNewPinScreen from 'screens/ChangePin/ConfirmNewPin';
import SendTokenAmountScreen from 'screens/SendTokenAmount';
import SendTokenContactsScreen from 'screens/SendTokenContacts';

// components
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
  SEND_TOKEN_FLOW,
} from 'constants/navigationConstants';
import RetryApiRegistration from 'components/RetryApiRegistration';

// actions
import { initAppAndRedirectAction, fetchUserAction } from 'actions/appActions';
import { stopListeningNotificationsAction, startListeningNotificationsAction } from 'actions/notificationsActions';

// constants
import { PENDING, REGISTERED } from 'constants/userConstants';

const SLEEP_TIMEOUT = 20000;
const BACKGROUND_APP_STATE = 'background';
const INACTIVE_APP_STATE = 'inactive';
const APP_LOGOUT_STATES = [BACKGROUND_APP_STATE, INACTIVE_APP_STATE];

const StackNavigatorModalConfig = {
  headerMode: 'float',
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
  transitionConfig: () => ({
    transitionSpec: {
      duration: 0,
      timing: Animated.timing,
      easing: Easing.step0,
    },
  }),
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
    [ASSETS]: assetsFlow,
    [ICO]: ICOScreen,
    [PROFILE]: ProfileScreen,
  }, {
    navigationOptions: ({ navigation }) => ({
      tabBarIcon: ({ focused, tintColor }) => {
        const { routeName } = navigation.state;
        let iconName;

        switch (routeName) {
          case ASSETS:
            iconName = `ios-albums${focused ? '' : '-outline'}`; break;
          case ICO:
            iconName = `ios-jet${focused ? '' : '-outline'}`; break;
          case PROFILE:
            iconName = `ios-contact${focused ? '' : '-outline'}`; break;
          default:
            return '';
        }

        return <Ionicons name={iconName} size={25} color={tintColor} />;
      },
    }),
    tabBarOptions: {
      activeTintColor: 'blue',
      inactiveTintColor: 'gray',
      activeBackgroundColor: 'white',
      inactiveBackgroundColor: 'white',
      style: {
        backgroundColor: 'white',
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
  }, {
    mode: 'modal',
    navigationOptions: {
      header: null,
    },
  },
);

type Props = {
  userState: ?string,
  fetchAppSettingsAndRedirect: Function,
  fetchUser: Function,
  startListeningNotifications: Function,
  stopListeningNotifications: Function,
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

const mapStateToProps = ({ user: { userState } }) => ({
  userState,
});

const mapDispatchToProps = (dispatch) => ({
  fetchAppSettingsAndRedirect: () => dispatch(initAppAndRedirectAction()),
  fetchUser: () => dispatch(fetchUserAction()),
  stopListeningNotifications: () => dispatch(stopListeningNotificationsAction()),
  startListeningNotifications: () => dispatch(startListeningNotificationsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(AppFlow);
