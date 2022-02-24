import { ReduxFirestoreType } from './firestore-type';
import { ReduxGasThresholdType } from './gas-threshold-type';

export type ReduxUnionType = ReduxFirestoreType | ReduxGasThresholdType;
