// @flow
import * as React from 'react';
import { addNavigationHelpers } from 'react-navigation';
import { Provider, connect } from 'react-redux';
import { createReduxBoundAddListener } from 'react-navigation-redux-helpers';
import RootNavigation from 'navigation/rootNavigation';
import { SHOW_STORYBOOK } from 'react-native-dotenv';
import { fetchAppSettingsAndRedirectAction } from 'actions/appSettingsActions';
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
  fetchAppSettingsAndRedirect: () => dispatch(fetchAppSettingsAndRedirectAction()),
});

const AppWithNavigationState = connect(mapStateToProps, mapDispatchToProps)(App);

const Root = () => (
  <Provider store={store}>
    <AppWithNavigationState />
  </Provider>
);

export default (__DEV__ && SHOW_STORYBOOK === 'true') ? StorybookUI : Root;
