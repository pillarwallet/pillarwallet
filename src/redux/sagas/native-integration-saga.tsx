import { takeEvery, call, put } from 'redux-saga/effects';

// Redux
import { ReduxNativeIntegrationType as t } from 'redux/redux-types/native-integration-type';
import { IReduxAction } from 'redux/interfaces/IReduxAction';
import { IReduxNativeIntegrationFetched } from 'redux/reducers/native-integration-reducer';

// Services
import * as Prismic from 'services/prismic';

// Utils
import { reportErrorLog } from 'utils/common';

const TYPE_NATIVE_INTEGRATION = 'native-integration';

// Watcher Saga
export default function* nativeIntegrationSaga() {
  yield takeEvery(t.FETCH_NATIVE_INTEGRATION, fetchNativeIntegrationSaga);
}

function* fetchNativeIntegrationSaga(actions: IReduxAction) {
  try {
    const payload: IReduxNativeIntegrationFetched = yield call(fetchNativeIntegration);
    yield put(payload);
  } catch (e) {
    reportErrorLog('Prismic content fetch failed', { e, documentId: TYPE_NATIVE_INTEGRATION });
    yield put<IReduxAction>({ type: t.FETCH_NATIVE_INTEGRATION_ERROR, error: e });
  }
}

const fetchNativeIntegration = async (): Promise<IReduxNativeIntegrationFetched> => {
  const prismicData = await Prismic.queryDocumentsByType(TYPE_NATIVE_INTEGRATION);
  return {
    type: t.NATIVE_INTEGRATION_FETCHED,
    payload: prismicData?.results,
  };
};
