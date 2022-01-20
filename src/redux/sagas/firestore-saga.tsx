import { takeEvery, call, put, select } from 'redux-saga/effects';
import { addHours, isBefore } from 'date-fns';
// Redux
import { RootReducerState } from 'reducers/rootReducer';
import { ReduxFirestoreType as t } from 'redux/redux-types/firestore-type';
import { IReduxAction } from 'redux/interfaces/IReduxAction';
import { IReduxFirestoreSyncedState } from 'redux/reducers/firestore-reducer';

// Constants
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';
import { API_REQUEST_TIMEOUT } from 'constants/appConstants';

// Services
import { firebaseRemoteConfig } from 'services/firebase';

// Utils
import httpRequest from 'utils/httpRequest';
import { logBreadcrumb } from 'utils/common';
import { purgeSensitiveDataFromState, validateStateToSync } from 'utils/firestore-helper';

// Watcher Saga
export default function* firestoreSaga() {
  yield takeEvery(t.FIRESTORE_SYNC_STATE, syncStateWithFirestoreSaga);
}

const requestConfig = {
  timeout: API_REQUEST_TIMEOUT,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

function* syncStateWithFirestoreSaga(actions: IReduxAction) {
  const state: RootReducerState = yield select();

  const lastSyncedUtc: string | null = state?.firestore?.lastSyncedUtc ?? null;

  try {
    const payload: IReduxFirestoreSyncedState = yield call(syncStateWithFirestore, state, lastSyncedUtc);
    logBreadcrumb(TAG, 'Synced state with Firestore');
    yield put(payload);
  } catch (e) {
    logBreadcrumb(TAG, 'Failed to sync state with Firestore');
    logBreadcrumb(TAG, e.toString());
    yield put<IReduxAction>({ type: t.FIRESTORE_SYNC_STATE_ERROR, error: e });
  }
}

const syncStateWithFirestore = async (
  state: RootReducerState,
  lastSyncedUtc?: string,
): Promise<IReduxFirestoreSyncedState> => {
  logBreadcrumb(TAG, 'Attempting to sync state with Firestore', state.firestore);

  // Purge sensitive data from the redux state
  let mutatedState = purgeSensitiveDataFromState(state);
  if (!validateStateToSync(mutatedState)) throw new Error('State still contains sensitive data');

  const firestoreUrl = firebaseRemoteConfig.getString(REMOTE_CONFIG.APP_API_USER_ENDPOINT);
  logBreadcrumb(TAG, 'Firestore url:', firestoreUrl);

  // Attempt sync reqeuest to Firebase
  const { data } = await httpRequest.post(firestoreUrl, mutatedState, requestConfig).catch(() => null);
  if (!data) throw new Error('No response from firestore request');

  let timeUtc = new Date().toUTCString();

  return {
    type: t.FIRESTORE_STATE_SYNCED,
    payload: {
      time: timeUtc,
    },
  };
};

const TAG = 'ReduxFirestoreSaga';
