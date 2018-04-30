// @flow
import * as React from 'react';
import type { NavigationContainerProps } from 'react-navigation';
import { AsyncStorage } from 'react-native';
import { addNavigationHelpers } from 'react-navigation';
import { Provider, connect } from 'react-redux';
import { createReduxBoundAddListener } from 'react-navigation-redux-helpers';
import RootNavigation from 'navigation/rootNavigation';
import { SHOW_STORYBOOK } from 'react-native-dotenv';
import { checkIfWalletExistsAction } from 'actions/walletActions';
import configureStore from './src/configureStore';
import StorybookUI from './storybook';

const store = configureStore();
const addListener = createReduxBoundAddListener('root');
AsyncStorage.clear()
type State = {
  isWalletStateDefined: ?string
}

type Props = {
  dispatch: Function,
  navigation: Object,
  checkIfWalletExists: Function,
  walletState: String,
}

class App extends React.Component<Props, State> {
  state = {
    isWalletStateDefined: null,
  }

  static getDerivedStateFromProps(nextProps: Props) {
    if (nextProps.walletState) {
      return {
        isWalletStateDefined: true
      }
    }

    return null;
  }
  componentDidMount() {
    const { checkIfWalletExists } = this.props;
    checkIfWalletExists();
  }

  render() {
    const { dispatch, navigation } = this.props;
    const { isWalletStateDefined } = this.state;
    return (
      isWalletStateDefined
        ? <RootNavigation
          navigation={addNavigationHelpers({
            dispatch,
            state: navigation,
            addListener,
          })}
        />
        : null
    )
  }
}

const mapStateToProps = ({ navigation, wallet: { walletState } }) => ({
  navigation,
  walletState
});

const mapDispatchToProps = (dispatch) => ({
  dispatch,
  checkIfWalletExists: () => dispatch(checkIfWalletExistsAction()),
});

const AppWithNavigationState = connect(mapStateToProps, mapDispatchToProps)(App);

const Root = () => (
  <Provider store={store}>
    <AppWithNavigationState />
  </Provider>
);

export default (__DEV__ && SHOW_STORYBOOK === 'true') ? StorybookUI : Root;
