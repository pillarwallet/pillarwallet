// @flow
import 'utils/setup';
import * as React from 'react';
import { StatusBar, BackHandler, NetInfo } from 'react-native';
import { NavigationActions } from 'react-navigation';
import { Root as NBRoot, Toast } from 'native-base';
import { Font } from 'expo';
import { Provider, connect } from 'react-redux';
import { reduxifyNavigator } from 'react-navigation-redux-helpers';
import RootNavigation from 'navigation/rootNavigation';
import { SHOW_STORYBOOK } from 'react-native-dotenv';
import { initAppAndRedirectAction } from 'actions/appActions';
import configureStore from './src/configureStore';
import StorybookUI from './storybook';

const store = configureStore();
const ReduxifiedRootNavigation = reduxifyNavigator(RootNavigation, 'root');
const aktivGroteskBold = require('./src/assets/fonts/AktivGrotesk-Bold.ttf');
const aktivGroteskMedium = require('./src/assets/fonts/AktivGrotesk-Medium.ttf');
const aktivGroteskRegular = require('./src/assets/fonts/AktivGrotesk-Regular.ttf');
const aktivGroteskLight = require('./src/assets/fonts/AktivGrotesk-Light.ttf');
const pillarIcons = require('./src/assets/fonts/PillarIcons.ttf');

type State = {
  isFetched: boolean,
  fontLoaded: boolean,
}

type Props = {
  dispatch: Function,
  navigation: Object,
  isFetched: Boolean,
  fetchAppSettingsAndRedirect: Function,
}

class App extends React.Component<Props, State> {
  state = {
    isFetched: false,
    fontLoaded: false,
  };

  static getDerivedStateFromProps(nextProps: Props) {
    return {
      isFetched: nextProps.isFetched,
    };
  }

  loadCustomFont = async () => {
    await Font.loadAsync({
      'aktiv-grotesk-bold': aktivGroteskBold,
      'aktiv-grotesk-medium': aktivGroteskMedium,
      'aktiv-grotesk-light': aktivGroteskLight,
      'aktiv-grotesk-regular': aktivGroteskRegular,
      'pillar-icons': pillarIcons,
    });
    this.setState({ fontLoaded: true });
  };

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
    NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
  }

  async componentDidMount() {
    const { fetchAppSettingsAndRedirect } = this.props;
    this.loadCustomFont();
    fetchAppSettingsAndRedirect();
    StatusBar.setBarStyle('dark-content');
    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
    NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
  }

  onBackPress = () => {
    const { dispatch, navigation } = this.props;
    const { routes, index } = navigation;
    if (routes[index].index === 0) {
      return false;
    }
    dispatch(NavigationActions.back());
    return true;
  };

  handleConnectivityChange = isOnline => {
    if (!isOnline) {
      Toast.show({
        type: 'danger',
        position: 'top',
        duration: 0,
        text: 'No active internet connection found!',
        buttonText: '',
      });
    } else {
      Toast.toastInstance._root.closeToast();
    }
  };

  render() {
    const { isFetched, fontLoaded } = this.state;
    const { navigation, dispatch } = this.props;
    if (!isFetched || !fontLoaded) return null;

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
  fetchAppSettingsAndRedirect: () => dispatch(initAppAndRedirectAction()),
});

const AppWithNavigationState = connect(mapStateToProps, mapDispatchToProps)(App);

const Root = () => (
  <NBRoot>
    <Provider store={store}>
      <AppWithNavigationState />
    </Provider>
  </NBRoot>
);

export default (__DEV__ && SHOW_STORYBOOK === 'true') ? StorybookUI : Root;
