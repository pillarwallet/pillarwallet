import { takeEvery, call, put, take, select } from 'redux-saga/effects';
import { ReduxFirestoreType as t } from 'redux/redux-types/firestore-type';
import { IReduxActions } from 'redux/interfaces/IReduxActions';
import { IReduxDataSentToFireStore } from 'redux/reducers/firestore-reducer';

// Watcher Saga
export default function* firestoreSaga() {
  yield takeEvery(t.SEND_DATA_TO_FIRESTORE, sendDataToFirestoreSaga);
}

function* sendDataToFirestoreSaga(actions: IReduxActions) {
  const payload: IReduxDataSentToFireStore = yield call(sendDataToFirestore);
  yield put(payload);
}
const sendDataToFirestore = async (): Promise<IReduxDataSentToFireStore> => {
  console.log(TAG, 'sending data to firestore saga');

  // Firestore code goes here...

  let time = new Date().toUTCString();
  return {
    type: t.DATA_SENT_TO_FIRESTORE,
    payload: {
      time: time,
    },
  };
};

const TAG = 'ReduxFirestoreSaga';
