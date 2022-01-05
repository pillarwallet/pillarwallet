import { IReduxActions } from 'redux/interfaces/IReduxActions';
import { ReduxFirestoreType as t } from 'redux/redux-types/firestore-type';
import { logBreadcrumb } from 'utils/common';

export const sendDataToFirestore = (): IReduxActions => {
  logBreadcrumb(TAG, 'send data to firestore action');

  return { type: t.SEND_DATA_TO_FIRESTORE };
};

const TAG = 'ReduxFirestoreActions';
