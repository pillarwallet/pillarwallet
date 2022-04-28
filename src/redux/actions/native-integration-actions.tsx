import { IReduxAction } from 'redux/interfaces/IReduxAction';
import { ReduxNativeIntegrationType as t } from 'redux/redux-types/native-integration-type';

export const fetchNativeIntegrationAbis = (): IReduxAction => ({ type: t.FETCH_NATIVE_INTEGRATION_ABIS });
