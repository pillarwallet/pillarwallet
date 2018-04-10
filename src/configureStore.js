/**
 * Create the Redux store
 */
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './reducers/rootReducer';

export default function configureStore(initialState: object = {}): object {
  const middlewares = [thunk];
  const store = createStore(
    rootReducer,
    applyMiddleware(...middlewares)
  );

  return store;
}