import { IReduxAction } from 'redux/interfaces/IReduxAction';
import { ReduxGasThresholdType as t } from 'redux/redux-types/gas-threshold-type';

export const fetchGasThresholds = (): IReduxAction => ({ type: t.FETCH_GAS_THRESHOLDS });

const TAG = 'ReduxGasThresholdActions';
