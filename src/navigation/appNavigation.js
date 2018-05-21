// @flow
import * as React from 'react';
import { StackNavigator, TabBarBottom, TabNavigator } from 'react-navigation';
import { connect } from 'react-redux';
import { AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// screens
import AddTokenScreen from 'screens/AddToken';
import AssetsScreen from 'screens/Assets';
import ICOScreen from 'screens/ICO';
import ProfileScreen from 'screens/Profile';

// components
import { ADD_TOKEN, ASSETS, ICO, PROFILE, TAB_NAVIGATION } from 'constants/navigationConstants';
import RetryApiRegistration from 'components/RetryApiRegistration';

// actions
import { initAppAndRedirectAction, fetchUserAction } from 'actions/appActions';

// constants
import { PENDING } from 'constants/userConstants';
import { REGISTERED } from '../constants/userConstants';

const SLEEP_TIMEOUT = 20000;
const BACKGROUND_APP_STATE = 'background';
const INACTIVE_APP_STATE = 'inactive';
const APP_LOGOUT_STATES = [BACKGROUND_APP_STATE, INACTIVE_APP_STATE];


const tabNavigation = TabNavigator(
  {
    [ASSETS]: AssetsScreen,
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
    tabBarComponent: TabBarBottom,
    tabBarPosition: 'bottom',
    animationEnabled: true,
    swipeEnabled: false,
  },
);

const AppFlowNavigation = StackNavigator(
  {
    [TAB_NAVIGATION]: tabNavigation,
    [ADD_TOKEN]: AddTokenScreen,
  }, {
    mode: 'modal',
    navigationOptions: {
      header: null,
    },
  },
);

type State = {
  user: Object,
};

type Props = {
  fetchAppSettingsAndRedirect: Function,
  fetchUser: Function,
  userState: ?string,
}

class AppFlow extends React.Component<Props, State> {
  timer: any | TimeoutID;

  componentDidMount() {
    const { fetchUser, userState } = this.props;
    if (userState !== REGISTERED) {
      fetchUser();
    }
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  handleAppStateChange = (nextAppState: string) => {
    const { fetchAppSettingsAndRedirect } = this.props;
    clearTimeout(this.timer);
    if (APP_LOGOUT_STATES.indexOf(nextAppState) > -1) {
      this.timer = setTimeout(() => fetchAppSettingsAndRedirect(), SLEEP_TIMEOUT);
    }
  }
  
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
});

export default connect(mapStateToProps, mapDispatchToProps)(AppFlow);
