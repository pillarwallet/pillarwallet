// @flow
import * as React from 'react';
import { StackNavigator, TabBarBottom, TabNavigator } from 'react-navigation';
import { Ionicons } from '@expo/vector-icons';

// screens
import AddTokenScreen from 'screens/AddToken';
import AssetsScreen from 'screens/Assets';
import ICOScreen from 'screens/ICO';
import ProfileScreen from 'screens/Profile';

// components
import { ADD_TOKEN, ASSETS, ICO, PROFILE, TAB_NAVIGATION } from 'constants/navigationConstants';
import RetryApiRegistration from 'components/RetryApiRegistration';
import Storage from 'services/storage';

const storage = Storage.getInstance('db');


const tabNavigation = TabNavigator(
  {
    [ASSETS]: AssetsScreen,
    [ICO]: ICOScreen,
    [PROFILE]: ProfileScreen,
  }, {
    ...getBottomNavigationOptions() // eslint-disable-line
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

export default class AppFlow extends React.Component<{}, State> {
  state = {
    user: {},
  };

  async componentDidMount() {
    const { user } = await storage.get('user');
    this.setState({ user: user || {} }); // eslint-disable-line
  }

  render() {
    const { user } = this.state;
    const userRegistered = Object.keys(user).length;

    if (!userRegistered) {
      return <RetryApiRegistration />;
    }

    return <AppFlowNavigation />;
  }
}

function getBottomNavigationOptions() {
  return {
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
  };
}
