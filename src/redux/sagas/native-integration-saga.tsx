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
  console.log(TAG, 'fetching abis...');

  let chainId: number | null = null;
  let contractAddress: string | null = null;
  let abis: any = null;
  let actions: any = null;

  const prismicData = await Prismic.queryDocumentsByType(TYPE_NATIVE_INTEGRATION);

  chainId = prismicData?.results?.[0].data?.chain_id ?? null;
  contractAddress = prismicData?.results?.[0].data?.contract_address ?? null;
  abis = JSON.parse(prismicData?.results?.[0].data?.abi) ?? null;
  actions = prismicData?.results?.[0].data?.actions ?? null;

  return {
    type: t.NATIVE_INTEGRATION_ABIS_FETCHED,
    payload: {
      chainId: chainId,
      contractAddress: contractAddress,
      abis: abis,
      actions: actions,
    },
  };
};

const TAG = 'ReduxNativeIntegrationSaga';
