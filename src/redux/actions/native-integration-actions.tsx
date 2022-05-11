import { IReduxAction } from 'redux/interfaces/IReduxAction';
import { ReduxNativeIntegrationType as t } from 'redux/redux-types/native-integration-type';

export const fetchNativeIntegration = (): IReduxAction => ({ type: t.FETCH_NATIVE_INTEGRATION });
