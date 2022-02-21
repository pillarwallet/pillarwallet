import { takeEvery, call, put, select } from 'redux-saga/effects';

// Redux
import { ReduxGasThresholdType as t } from 'redux/redux-types/gas-threshold-type';
import { IReduxAction } from 'redux/interfaces/IReduxAction';
import { IGasThresholdInfo, IGasThresholds, IReduxGasThresholdsFetched } from 'redux/reducers/gas-threshold-reducer';

// Services
import * as Prismic from 'services/prismic';

// Utils
import { logBreadcrumb, reportErrorLog } from 'utils/common';

const TYPE_HIGH_GAS_THRESHOLD = 'high_gas_threshold';

// Watcher Saga
export default function* gasThresholdSaga() {
  yield takeEvery(t.FETCH_GAS_THRESHOLDS, fetchGasThresholdsSaga);
}

function* fetchGasThresholdsSaga(actions: IReduxAction) {
  try {
    const payload: IReduxGasThresholdsFetched = yield call(fetchGasThresholds);
    yield put(payload);
  } catch (e) {
    reportErrorLog('Prismic content fetch failed', { e, documentId: TYPE_HIGH_GAS_THRESHOLD });
    yield put<IReduxAction>({ type: t.FETCH_GAS_THRESHOLDS_ERROR, error: e });
  }
}

const fetchGasThresholds = async (): Promise<IReduxGasThresholdsFetched> => {
  let thresholds: IGasThresholds = {};

  const prismicData = await Prismic.queryDocumentsByType(TYPE_HIGH_GAS_THRESHOLD);
  if (!prismicData?.results) throw new Error('failed to load documents from prismic');

  prismicData.results.forEach((result, i) => {
    if (!result.data?.chain_id || !result.data.threshold) return;

    let data = result.data;
    thresholds[data.chain_id] = {
      chainId: data.chain_id || 0,
      threshold: data.threshold || 0,
      networkName: data.network_name[0].text || null,
    };

    // Create data for Kovan using ETH params
    if (data.chain_id === 1) {
      thresholds[42] = {
        chainId: 42 || 0,
        threshold: data.threshold || 0,
        networkName: data.network_name[0].text || null,
      };
    }

    // Create data for Mumbai using MATIC params
    if (data.chain_id === 137) {
      thresholds[80001] = {
        chainId: 80001 || 0,
        threshold: data.threshold || 0,
        networkName: data.network_name[0].text || null,
      };
    }
  });

  return {
    type: t.GAS_THRESHOLDS_FETCHED,
    payload: {
      gasThresholds: thresholds,
    },
  };
};

const TAG = 'ReduxGasThresholdSaga';
