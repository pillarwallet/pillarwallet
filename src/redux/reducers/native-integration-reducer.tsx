import { IReduxAction } from 'redux/interfaces/IReduxAction';
import { updateObject, createReducer } from 'redux/reducers/reducer-utilities';
import { ProcessState } from 'models/ProcessState';
import { ReduxNativeIntegrationType as t } from 'redux/redux-types/native-integration-type';

export interface IReduxNativeIntegrationState {
  data?: any;
  fetchState?: ProcessState;
  error?: string | null;
}

const initialState: IReduxNativeIntegrationState = {
  data: null,
  fetchState: ProcessState.READY,
  error: null,
};

const fetchNativeIntegration = (state: IReduxNativeIntegrationState, actions: IReduxAction) =>
  updateObject(state, { fetchState: ProcessState.PROCESSING });

export interface IReduxNativeIntegrationFetched extends IReduxAction {
  type: t.NATIVE_INTEGRATION_FETCHED;
  payload: Object;
}

const nativeIntegrationFetched = (state: IReduxNativeIntegrationState, actions: IReduxNativeIntegrationFetched) =>
  updateObject(state, {
    fetchState: ProcessState.HANDLED,
    data: actions.payload,
  });

const fetchNativeIntegrationError = (state: IReduxNativeIntegrationState, actions: IReduxAction) =>
  updateObject(state, { fetchState: ProcessState.HANDLED, error: actions.payload.error?.toString() || null });

const nativeIntegrationReducer = createReducer(initialState, {
  [t.FETCH_NATIVE_INTEGRATION]: fetchNativeIntegration,
  [t.NATIVE_INTEGRATION_FETCHED]: nativeIntegrationFetched,
  [t.FETCH_NATIVE_INTEGRATION_ERROR]: fetchNativeIntegrationError,
});

export default nativeIntegrationReducer;
