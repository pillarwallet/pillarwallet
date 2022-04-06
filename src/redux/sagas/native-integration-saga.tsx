import { takeEvery, call, put } from 'redux-saga/effects';

// Redux
import { ReduxNativeIntegrationType as t } from 'redux/redux-types/native-integration-type';
import { IReduxAction } from 'redux/interfaces/IReduxAction';
import { IReduxNativeIntegrationAbisFetched } from 'redux/reducers/native-integration-reducer';

// Services
import * as Prismic from 'services/prismic';

// Utils
import { reportErrorLog } from 'utils/common';

const TYPE_NATIVE_INTEGRATION = 'native-integration';

// Watcher Saga
export default function* nativeIntegrationSaga() {
  yield takeEvery(t.FETCH_NATIVE_INTEGRATION_ABIS, fetchNativeIntegrationAbisSaga);
}

function* fetchNativeIntegrationAbisSaga(actions: IReduxAction) {
  try {
    const payload: IReduxNativeIntegrationAbisFetched = yield call(fetchNativeIntegrationAbis);
    yield put(payload);
  } catch (e) {
    reportErrorLog('Prismic content fetch failed', { e, documentId: TYPE_NATIVE_INTEGRATION });
    yield put<IReduxAction>({ type: t.FETCH_NATIVE_INTEGRATION_ABIS_ERROR, error: e });
  }
}

const fetchNativeIntegrationAbis = async (): Promise<IReduxNativeIntegrationAbisFetched> => {
  const prismicData = await Prismic.queryDocumentsByType(TYPE_NATIVE_INTEGRATION);

  console.log('prismicData', prismicData);
  return {
    type: t.NATIVE_INTEGRATION_ABIS_FETCHED,
    payload: prismicData?.results,
  };
};

const TAG = 'ReduxNativeIntegrationSaga';
