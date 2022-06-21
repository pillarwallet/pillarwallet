import { ReduxFirestoreType } from './firestore-type';
import { ReduxGasThresholdType } from './gas-threshold-type';
import { ReduxNativeIntegrationType } from './native-integration-type';

export type ReduxUnionType = ReduxFirestoreType | ReduxGasThresholdType | ReduxNativeIntegrationType;
