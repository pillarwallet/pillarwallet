// @flow
import {
  SET_HISTORY,
  UPDATE_HISTORY_NOTIFICATIONS,
  TRANSACTION_EVENT,
} from 'constants/historyConstants';
import { UPDATE_SUPPORTED_ASSETS } from 'constants/assetsConstants';
import { fetchAssetsBalancesAction, updateAssetsAction } from './assetsActions';

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

    const historyNotifications = await api.fetchNotifications(walletId, TRANSACTION_EVENT);
    const mappedHistoryNotifications = historyNotifications
      .map(({ payload, type, createdAt }) => ({ ...payload, type, createdAt }));

    // check if some assets are not enabled
    const myAddress = wallet.address.toUpperCase();
    const missedAssets = mappedHistoryNotifications
      .filter(tx => tx.fromAddress.toUpperCase() !== myAddress)
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

    dispatch({
      type: UPDATE_HISTORY_NOTIFICATIONS,
      payload: mappedHistoryNotifications,
    });
  };
};
