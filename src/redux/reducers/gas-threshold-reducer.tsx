import { IReduxAction } from 'redux/interfaces/IReduxAction';
import { updateObject, createReducer } from 'redux/reducers/reducer-utilities';
import { ProcessState } from 'models/ProcessState';
import { ReduxGasThresholdType as t } from 'redux/redux-types/gas-threshold-type';

export interface IGasThresholdInfo {
  chainId: number;
  threshold: number;
  networkName: string | null;
}

export interface IGasThresholds {
  [key: string]: IGasThresholdInfo;
}

export interface IReduxGasThresholdState {
  fetchState?: ProcessState;
  gasThresholds?: IGasThresholds;
  error?: string | null;
}

const initialState: IReduxGasThresholdState = {
  fetchState: ProcessState.READY,
  gasThresholds: null,
  error: null,
};

const fetchGasThresholds = (state: IReduxGasThresholdState, actions: IReduxAction) =>
  updateObject(state, { fetchState: ProcessState.PROCESSING });

export interface IReduxGasThresholdsFetched extends IReduxAction {
  type: t.GAS_THRESHOLDS_FETCHED;
  payload: {
    gasThresholds?: IGasThresholds;
  };
}

const gasThresholdsFetched = (state: IReduxGasThresholdState, actions: IReduxGasThresholdsFetched) =>
  updateObject(state, {
    fetchState: ProcessState.HANDLED,
    gasThresholds: actions.payload.gasThresholds || null,
  });

const fetchGasThresholdsError = (state: IReduxGasThresholdState, actions: IReduxAction) =>
  updateObject(state, { fetchState: ProcessState.HANDLED, error: actions.payload.error?.toString() || null });

const gasThresholdReducer = createReducer(initialState, {
  [t.FETCH_GAS_THRESHOLDS]: fetchGasThresholds,
  [t.GAS_THRESHOLDS_FETCHED]: gasThresholdsFetched,
  [t.FETCH_GAS_THRESHOLDS_ERROR]: fetchGasThresholdsError,
});

export default gasThresholdReducer;

const TAG = 'ReduxGasThresholdReducer';
