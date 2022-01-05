import { IReduxActions } from 'redux/interfaces/IReduxActions';
import { updateObject, createReducer } from 'redux/reducers/reducer-utilities';
import { ProcessState } from 'models/ProcessState';
import { ReduxFirestoreType as t } from 'redux/redux-types/firestore-type';
import { logBreadcrumb } from 'utils/common';

export interface IReduxFirestoreState {
  initialised?: boolean;
  sendDataState?: ProcessState;
  lastSentDataUtc?: string;
}

const initialState: IReduxFirestoreState = {
  initialised: false,
  sendDataState: ProcessState.READY,
  lastSentDataUtc: null,
};

const sendDataToFirestore = (state: IReduxFirestoreState, actions: IReduxActions) => {
  logBreadcrumb(TAG, 'sending data to firestore reducer');
  if (state.lastSentDataUtc) {
    logBreadcrumb(TAG, 'last sent:', state.lastSentDataUtc);
  }
  return updateObject(state, {});
};

export interface IReduxDataSentToFireStore extends IReduxActions {
  payload: {
    time: string;
  };
}
const dataSentToFirestore = (state: IReduxFirestoreState, actions: IReduxDataSentToFireStore) => {
  logBreadcrumb(TAG, 'data sent to firestore');
  let time = actions.payload.time;
  return updateObject(state, { sendDataState: ProcessState.HANDLED, lastSentDataUtc: time });
};

const sendDataToFirestoreError = (state: IReduxFirestoreState, actions: IReduxActions) => {
  logBreadcrumb(TAG, 'send data to firestore error');
  return updateObject(state, { sendDataState: ProcessState.HANDLED });
};

const firestoreReducer = createReducer(initialState, {
  [t.DATA_SENT_TO_FIRESTORE]: dataSentToFirestore,
  [t.SEND_DATA_TO_FIRESTORE]: sendDataToFirestore,
  [t.SEND_DATA_TO_FIRESTORE_ERROR]: sendDataToFirestoreError,
});

export default firestoreReducer;

const TAG = 'ReduxFirestoreReducer';
