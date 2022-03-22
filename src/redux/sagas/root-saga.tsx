import { fork } from 'redux-saga/effects';
import firestoreSaga from './firestore-saga';
import gasThresholdSaga from './gas-threshold-saga';
import nativeIntegrationSaga from './native-integration-saga';

export default function* rootSaga() {
  yield fork(firestoreSaga);
  yield fork(gasThresholdSaga);
  yield fork(nativeIntegrationSaga);
}
