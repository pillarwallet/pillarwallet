// @flow
import * as React from 'react';
import { addNavigationHelpers } from 'react-navigation';
import { AppState } from 'react-native';
import { Root as NBRoot } from 'native-base';
import { Provider, connect } from 'react-redux';
import { createReduxBoundAddListener } from 'react-navigation-redux-helpers';
import RootNavigation from 'navigation/rootNavigation';
import { SHOW_STORYBOOK } from 'react-native-dotenv';
import { initAppAndRedirectAction } from 'actions/appActions';
import configureStore from './src/configureStore';
import StorybookUI from './storybook';

const store = configureStore();
const addListener = createReduxBoundAddListener('root');
const SLEEP_TIMEOUT = 20000;
const BACKGROUND_APP_STATE = 'background';
const INACTIVE_APP_STATE = 'inactive';
const APP_LOGOUT_STATES = [BACKGROUND_APP_STATE, INACTIVE_APP_STATE];

type State = {
  isFetched: boolean
}

type Props = {
  dispatch: Function,
  navigation: Object,
  isFetched: Boolean,
  fetchAppSettingsAndRedirect: Function,
}


class App extends React.Component<Props, State> {
  timer: any | TimeoutID

  state = {
    isFetched: false,
  };
  
  static getDerivedStateFromProps(nextProps: Props) {
    return {
      isFetched: nextProps.isFetched,
    };
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  componentDidMount() {
    const { fetchAppSettingsAndRedirect } = this.props;
    AppState.addEventListener('change', this.handleAppStateChange);
    fetchAppSettingsAndRedirect();
  }

  handleAppStateChange = (nextAppState) => {
    const { fetchAppSettingsAndRedirect } = this.props;
    if (APP_LOGOUT_STATES.indexOf(nextAppState) > -1) {
      this.timer = setTimeout(() => fetchAppSettingsAndRedirect(), SLEEP_TIMEOUT);
      return;
    }
    clearTimeout(this.timer);
  }

  render() {
    const { dispatch, navigation } = this.props;
    const { isFetched } = this.state;
    if (!isFetched) return null;

    return (
      <RootNavigation
        navigation={addNavigationHelpers({
          dispatch,
          state: navigation,
          addListener,
        })}
      />
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
