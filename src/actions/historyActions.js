// @flow
import {
  SET_HISTORY,
  TRANSACTION_EVENT,
} from 'constants/historyConstants';
import { UPDATE_SUPPORTED_ASSETS } from 'constants/assetsConstants';
import Storage from 'services/storage';
import { fetchAssetsBalancesAction, updateAssetsAction } from './assetsActions';

const storage = Storage.getInstance('db');
const TRANSACTIONS_HISTORY_STEP = 10;

export const fetchTransactionsHistoryAction = (walletAddress: string, asset: string = 'ALL', fromIndex: number = 0) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const history = await api.fetchHistory({
      address1: walletAddress,
      asset,
      nbTx: TRANSACTIONS_HISTORY_STEP,
      fromIndex,
    });
    if (!history.length) return;
    storage.save('history', { history }, true);
    dispatch({
      type: SET_HISTORY,
      payload: history,
    });
  };
};

export const fetchTransactionsHistoryNotificationsAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId } },
      assets: { data: currentAssets, supportedAssets },
      wallet: { data: wallet },
    } = getState();

    // load supported assets
    let walletSupportedAssets = { ...supportedAssets };
    if (!supportedAssets.length) {
      walletSupportedAssets = await api.fetchSupportedAssets(walletId);
      dispatch({
        type: UPDATE_SUPPORTED_ASSETS,
        payload: walletSupportedAssets,
      });
    }
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const historyNotifications = await api.fetchNotifications(walletId, TRANSACTION_EVENT, d.toISOString());
    const mappedHistoryNotifications = historyNotifications
      .map(({ payload, type, createdAt }) => ({ ...payload, type, createdAt }));

    // check if some assets are not enabled
    const myAddress = wallet.address.toUpperCase();
    const missedAssets = mappedHistoryNotifications
      .filter(tx => tx.from.toUpperCase() !== myAddress)
      .reduce((memo, { asset: ticker }) => {
        if (memo[ticker] !== undefined || currentAssets[ticker] !== undefined) return memo;

        const supportedAsset = walletSupportedAssets.find(asset => asset.symbol === ticker);
        if (supportedAsset) {
          memo[ticker] = supportedAsset;
        }
        return memo;
      }, {});

    if (Object.keys(missedAssets).length) {
      const newAssets = { ...currentAssets, ...missedAssets };
      dispatch(updateAssetsAction(newAssets));
      dispatch(fetchAssetsBalancesAction(newAssets, wallet.address));
    }

    storage.save('history', { history: mappedHistoryNotifications }, true);
    dispatch({
      type: SET_HISTORY,
      payload: mappedHistoryNotifications,
    });
  };
};
