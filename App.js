// @flow
import 'utils/setup';
import * as React from 'react';
import { StatusBar } from 'react-native';
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

  componentDidMount() {
    const { fetchAppSettingsAndRedirect } = this.props;
    fetchAppSettingsAndRedirect();
    StatusBar.setBarStyle("dark-content");
  }

  render() {
    const { dispatch, navigation } = this.props;
    const { isFetched } = this.state;
    if (!isFetched) return null;

    return (
      <RootNavigation
        navigation={{
          dispatch,
          state: navigation,
          addListener,
        }}
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
