// @flow
import {
  SET_HISTORY,
  UPDATE_HISTORY_NOTIFICATIONS,
  TRANSACTION_EVENT,
} from 'constants/historyConstants';

export const fetchTransactionsHistoryAction = (walletAddress: string, asset: string = 'ALL') => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const history = await api.fetchHistory({ address1: walletAddress, asset });
    dispatch({
      type: SET_HISTORY,
      payload: {
        transactions: history,
        asset,
      },
    });
  };
};

export const fetchTransactionsHistoryNotificationsAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: user },
    } = getState();

    const historyNotifications = await api.fetchNotifications(user.walletId, TRANSACTION_EVENT);
    const mappedHistoryNotifications = historyNotifications
      .map(({ payload, type, createdAt }) => ({ ...payload, type, createdAt }));

    dispatch({
      type: UPDATE_HISTORY_NOTIFICATIONS,
      payload: mappedHistoryNotifications,
    });
  };
};
