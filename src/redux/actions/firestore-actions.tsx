import { IReduxAction } from 'redux/interfaces/IReduxAction';
import { ReduxFirestoreType as t } from 'redux/redux-types/firestore-type';
import { logBreadcrumb } from 'utils/common';

export const syncStateWithFirestore = (): IReduxAction => {
  logBreadcrumb(TAG, 'sync state firestore action');

  return { type: t.FIRESTORE_SYNC_STATE };
};

const TAG = 'ReduxFirestoreActions';
