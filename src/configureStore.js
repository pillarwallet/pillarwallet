// @flow
/**
 * Create the Redux store
 */
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { createReactNavigationReduxMiddleware } from 'react-navigation-redux-helpers';
import rootReducer from './reducers/rootReducer';

const navigationMiddleware = createReactNavigationReduxMiddleware(
  'root',
  ({ navigation }) => navigation,
);

export default function configureStore(initialState: ?Object): Object {
  const middlewares = [thunk, navigationMiddleware];
  const store = createStore(
    rootReducer,
    initialState,
    applyMiddleware(...middlewares),
  );

  return store;
}
