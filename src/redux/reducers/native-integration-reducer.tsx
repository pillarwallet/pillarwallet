import { IReduxAction } from 'redux/interfaces/IReduxAction';
import { updateObject, createReducer } from 'redux/reducers/reducer-utilities';
import { ProcessState } from 'models/ProcessState';
import { ReduxNativeIntegrationType as t } from 'redux/redux-types/native-integration-type';

export interface IReduxNativeIntegrationState {
  abis?: any;
  fetchState?: ProcessState;
  error?: string | null;
}

const initialState: IReduxNativeIntegrationState = {
  abis: null,
  fetchState: ProcessState.READY,
  error: null,
};

const fetchNativeIntegrationAbis = (state: IReduxNativeIntegrationState, actions: IReduxAction) =>
  updateObject(state, { fetchState: ProcessState.PROCESSING });

export interface IReduxNativeIntegrationAbisFetched extends IReduxAction {
  type: t.NATIVE_INTEGRATION_ABIS_FETCHED;
  payload: {
    chainId: number | null;
    contractAddress: string | null;
    abis: any;
    actions: any;
  };
}

const nativeIntegrationAbisFetched = (
  state: IReduxNativeIntegrationState,
  actions: IReduxNativeIntegrationAbisFetched,
) =>
  updateObject(state, {
    fetchState: ProcessState.HANDLED,
    abis: actions.payload,
  });

const fetchNativeIntegrationAbisError = (state: IReduxNativeIntegrationState, actions: IReduxAction) =>
  updateObject(state, { fetchState: ProcessState.HANDLED, error: actions.payload.error?.toString() || null });

const nativeIntegrationReducer = createReducer(initialState, {
  [t.FETCH_NATIVE_INTEGRATION_ABIS]: fetchNativeIntegrationAbis,
  [t.NATIVE_INTEGRATION_ABIS_FETCHED]: nativeIntegrationAbisFetched,
  [t.FETCH_NATIVE_INTEGRATION_ABIS_ERROR]: fetchNativeIntegrationAbisError,
});

export default nativeIntegrationReducer;

const TAG = 'ReduxNativeIntegrationReducer';
