// @flow
/**
 * Create the Redux store
 */
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createReactNavigationReduxMiddleware } from 'react-navigation-redux-helpers';
import rootReducer from './reducers/rootReducer';

const navigationMiddleware = createReactNavigationReduxMiddleware(
  'root',
  ({ navigation }) => navigation,
);

const middlewares = [thunk, navigationMiddleware];
const enhancer = composeWithDevTools({
  // Options: https://github.com/jhen0409/react-native-debugger#options
})(applyMiddleware(...middlewares));

export default function configureStore(initialState: ?Object): Object {
  const store = createStore(
    rootReducer,
    initialState,
    enhancer,
  );

  return store;
}
