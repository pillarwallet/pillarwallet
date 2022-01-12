import { IReduxAction } from 'redux/interfaces/IReduxAction';
import { updateObject, createReducer } from 'redux/reducers/reducer-utilities';
import { ProcessState } from 'models/ProcessState';
import { ReduxFirestoreType as t } from 'redux/redux-types/firestore-type';
import { logBreadcrumb } from 'utils/common';

export interface IReduxFirestoreState {
  syncDataState?: ProcessState;
  lastSyncedUtc?: string;
  error?: string | null;
}

const initialState: IReduxFirestoreState = {
  syncDataState: ProcessState.READY,
  lastSyncedUtc: null,
  error: null,
};

const syncState = (state: IReduxFirestoreState, actions: IReduxAction) => {
  if (state.lastSyncedUtc) {
    logBreadcrumb(TAG, 'last sent:', state.lastSyncedUtc);
  }
  return updateObject(state, { syncDataState: ProcessState.PROCESSING });
};

export interface IReduxFirestoreSyncedState extends IReduxAction {
  type: t.FIRESTORE_STATE_SYNCED;
  payload: {
    time: string;
  };
}

const stateSynced = (state: IReduxFirestoreState, actions: IReduxFirestoreSyncedState) => {
  let time = actions.payload.time;
  return updateObject(state, { syncDataState: ProcessState.HANDLED, lastSyncedUtc: time, error: null });
};

const syncStateError = (state: IReduxFirestoreState, actions: IReduxAction) => {
  let error = actions.error.toString() ?? null;
  return updateObject(state, { syncDataState: ProcessState.HANDLED, error: error });
};

const firestoreReducer = createReducer(initialState, {
  [t.FIRESTORE_SYNC_STATE]: syncState,
  [t.FIRESTORE_STATE_SYNCED]: stateSynced,
  [t.FIRESTORE_SYNC_STATE_ERROR]: syncStateError,
});

export default firestoreReducer;

const TAG = 'ReduxFirestoreReducer';
