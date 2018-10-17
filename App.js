// @flow
import 'utils/setup';
import * as React from 'react';
import Intercom from 'react-native-intercom';
import { StatusBar, NetInfo, AppState, Platform } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import { Provider, connect } from 'react-redux';
import { reduxifyNavigator } from 'react-navigation-redux-helpers';
import RootNavigation from 'navigation/rootNavigation';
import { Sentry } from 'react-native-sentry';
import TestFairy from 'react-native-testfairy';
import { SENTRY_DSN, TESTFAIRY_ACCESS_TOKEN } from 'react-native-dotenv';
import { initAppAndRedirectAction } from 'actions/appActions';
import { updateSessionNetworkStatusAction } from 'actions/sessionActions';
import {
  startListeningOnOpenNotificationAction,
  stopListeningOnOpenNotificationAction,
} from 'actions/notificationsActions';
import Root from 'components/Root';
import Toast from 'components/Toast';
import configureStore from './src/configureStore';

const store = configureStore();
const ReduxifiedRootNavigation = reduxifyNavigator(RootNavigation, 'root');

type Props = {
  dispatch: Function,
  navigation: Object,
  isFetched: Boolean,
  fetchAppSettingsAndRedirect: Function,
  updateSessionNetworkStatus: Function,
  startListeningOnOpenNotification: Function,
  stopListeningOnOpenNotification: Function,
}

class App extends React.Component<Props, *> {
  constructor(props: Props) {
    super(props);
    if (!__DEV__) {
      Sentry.config(SENTRY_DSN).install();
      TestFairy.begin(TESTFAIRY_ACCESS_TOKEN);
    }
  }

  componentWillUnmount() {
    const { stopListeningOnOpenNotification } = this.props;
    stopListeningOnOpenNotification();
    NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
  }

  componentDidMount() {
    const { fetchAppSettingsAndRedirect, startListeningOnOpenNotification } = this.props;
    Intercom.setInAppMessageVisibility('GONE'); // prevent messanger launcher to appear
    SplashScreen.hide();
    fetchAppSettingsAndRedirect(AppState.currentState, Platform.OS);
    StatusBar.setBarStyle('dark-content');
    NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
    startListeningOnOpenNotification();
  }

  handleConnectivityChange = isOnline => {
    const { updateSessionNetworkStatus } = this.props;
    updateSessionNetworkStatus(isOnline);
    if (!isOnline) {
      Toast.show({
        message: 'No active internet connection found!',
        type: 'warning',
        title: 'Connection Issue',
        autoClose: false,
      });
    } else {
      Toast.close();
    }
  };

  render() {
    const { navigation, dispatch, isFetched } = this.props;
    if (!isFetched) return null;

    return (
      <ReduxifiedRootNavigation state={navigation} dispatch={dispatch} />
    );
  }
}

const mapStateToProps = ({ navigation, appSettings: { isFetched } }) => ({
  navigation,
  isFetched,
});

const mapDispatchToProps = (dispatch) => ({
  dispatch,
  fetchAppSettingsAndRedirect: (appState: string, platform: string) =>
    dispatch(initAppAndRedirectAction(appState, platform)),
  updateSessionNetworkStatus: (isOnline: boolean) => dispatch(updateSessionNetworkStatusAction(isOnline)),
  startListeningOnOpenNotification: () => dispatch(startListeningOnOpenNotificationAction()),
  stopListeningOnOpenNotification: () => dispatch(stopListeningOnOpenNotificationAction()),
});

const AppWithNavigationState = connect(mapStateToProps, mapDispatchToProps)(App);

const AppRoot = () => (
  <Root>
    <Provider store={store}>
      <AppWithNavigationState />
    </Provider>
  </Root>
);

export default AppRoot;
