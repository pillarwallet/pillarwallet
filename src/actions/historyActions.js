// @flow
import { uniqBy } from 'utils/common';
import {
  SET_HISTORY,
  TRANSACTION_EVENT,
  SET_GAS_INFO,
} from 'constants/historyConstants';
import { UPDATE_SUPPORTED_ASSETS, UPDATE_ASSETS, ETH } from 'constants/assetsConstants';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { fetchAssetsBalancesAction, updateAssetsAction } from './assetsActions';
import { saveDbAction } from './dbActions';

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

    const { history: { data: currentHistory } } = getState();
    const updatedHistory = uniqBy([...history, ...currentHistory], 'hash');
    dispatch(saveDbAction('history', { history: updatedHistory }, true));

    dispatch({
      type: SET_HISTORY,
      payload: updatedHistory,
    });
  };
};

export const fetchContactTransactionsAction = (myAddress: string, contactAddress: string, asset?: string = 'ALL') => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const history = await api.fetchHistory({
      address1: myAddress,
      address2: contactAddress,
      asset,
      nbTx: TRANSACTIONS_HISTORY_STEP,
      fromIndex: 0,
    });
    if (!history.length) return;

    const { history: { data: currentHistory } } = getState();
    const updatedHistory = uniqBy([...history, ...currentHistory], 'hash');
    dispatch(saveDbAction('history', { history: updatedHistory }, true));

    dispatch({
      type: SET_HISTORY,
      payload: updatedHistory,
    });
  };
};

export const fetchTransactionsHistoryNotificationsAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId } },
      assets: { data: currentAssets, supportedAssets },
      wallet: { data: wallet },
      history: { data: currentHistory },
      appSettings: { data: { lastTxSyncDatetime } },
    } = getState();

    // load supported assets
    let walletSupportedAssets = [...supportedAssets];
    if (!supportedAssets.length) {
      walletSupportedAssets = await api.fetchSupportedAssets(walletId);
      dispatch({
        type: UPDATE_SUPPORTED_ASSETS,
        payload: walletSupportedAssets,
      });
      const currentAssetsTickers = Object.keys(currentAssets);

      // HACK: Dirty fix for users who removed somehow Eth from their assets list
      if (!currentAssetsTickers.includes(ETH)) currentAssetsTickers.push(ETH);

      if (walletSupportedAssets.length) {
        const updatedAssets = walletSupportedAssets
          .filter(asset => currentAssetsTickers.includes(asset.symbol))
          .reduce((memo, asset) => ({ ...memo, [asset.symbol]: asset }), {});
        dispatch({
          type: UPDATE_ASSETS,
          payload: updatedAssets,
        });
        dispatch(saveDbAction('assets', { assets: updatedAssets }, true));
      }
    }
    const d = new Date(lastTxSyncDatetime * 1000);
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
    const updatedHistory = uniqBy([...mappedHistoryNotifications, ...currentHistory], 'hash');
    const lastCreatedAt = Math.max(...updatedHistory.map(({ createdAt }) => createdAt).concat(0));
    dispatch(saveDbAction('history', { history: updatedHistory }, true));
    dispatch(saveDbAction('app_settings', { appSettings: { lastTxSyncDatetime: lastCreatedAt } }));
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: { lastTxSyncDatetime: lastCreatedAt },
    });
    dispatch({
      type: SET_HISTORY,
      payload: updatedHistory,
    });
  };
};

export const fetchGasInfoAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const gasInfo = await api.fetchGasInfo();
    dispatch({
      type: SET_GAS_INFO,
      payload: gasInfo,
    });
  };
};

export const updateTransactionStatusAction = (hash: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      session: { data: { isOnline } },
      history: { data: history },
    } = getState();

    if (!isOnline) return;

    const txInfo = await api.fetchTxInfo(hash);
    const txReceipt = await api.fetchTransactionReceipt(hash);
    const lastBlockNumber = await api.fetchLastBlockNumber();
    if (!txInfo || !txReceipt || !lastBlockNumber) return;

    const nbConfirmations = lastBlockNumber - txReceipt.blockNumber;
    const status = txReceipt.status ? 'confirmed' : 'failed';

    const updatedHistory = history.map(tx => {
      if (tx.hash !== hash) return tx;
      return {
        ...tx,
        nbConfirmations,
        status,
      };
    });
    dispatch({
      type: SET_HISTORY,
      payload: updatedHistory,
    });
    dispatch(saveDbAction('history', { history: updatedHistory }, true));
  };
};
