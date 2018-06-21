// @flow
import 'utils/setup';
import * as React from 'react';
import { StatusBar, BackHandler } from 'react-native';
import { NavigationActions } from 'react-navigation';
import { Root as NBRoot } from 'native-base';
import { Provider, connect } from 'react-redux';
import { reduxifyNavigator } from 'react-navigation-redux-helpers';
import RootNavigation from 'navigation/rootNavigation';
import { SHOW_STORYBOOK } from 'react-native-dotenv';
import { initAppAndRedirectAction } from 'actions/appActions';
import configureStore from './src/configureStore';
import StorybookUI from './storybook';

const store = configureStore();
const ReduxifiedRootNavigation = reduxifyNavigator(RootNavigation, 'root');

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
  state = {
    isFetched: false,
  };

  static getDerivedStateFromProps(nextProps: Props) {
    return {
      isFetched: nextProps.isFetched,
    };
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
  }

  componentDidMount() {
    const { fetchAppSettingsAndRedirect } = this.props;
    fetchAppSettingsAndRedirect();
    StatusBar.setBarStyle('dark-content');
    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
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

  render() {
    const { isFetched } = this.state;
    const { navigation, dispatch } = this.props;
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
