import { fork } from 'redux-saga/effects';
import firestoreSaga from './firestore-saga';

export default function* rootSaga() {
  yield fork(firestoreSaga);
}
