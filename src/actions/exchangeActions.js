// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import { Linking } from 'react-native';
import { toChecksumAddress } from '@netgum/utils';

// components
import Toast from 'components/Toast';

// constants
import {
  RESET_OFFERS,
  ADD_OFFER,
  SET_EXCHANGE_SEARCH_REQUEST,
  SET_EXECUTING_TRANSACTION,
  SET_DISMISS_TRANSACTION,
  ADD_EXCHANGE_ALLOWANCE,
  UPDATE_EXCHANGE_ALLOWANCE,
  ADD_CONNECTED_EXCHANGE_PROVIDER,
  REMOVE_CONNECTED_EXCHANGE_PROVIDER,
  PROVIDER_SHAPESHIFT,
  MARK_NOTIFICATION_SEEN,
  SET_EXCHANGE_PROVIDERS_METADATA,
  SET_EXCHANGE_SUPPORTED_ASSETS,
} from 'constants/exchangeConstants';
import { TX_CONFIRMED_STATUS } from 'constants/historyConstants';

// utils
import { getSmartWalletAddress } from 'utils/accounts';
import { getPreferredWalletId } from 'utils/smartWallet';

// services
import ExchangeService from 'services/exchange';
import { getUniswapOffer, createUniswapOrder } from 'services/uniswap';
import { get1inchOffer, create1inchOrder } from 'services/1inch';

// types
import type { Dispatch, GetState, RootReducerState } from 'reducers/rootReducer';
import type { Asset } from 'models/Asset';

// actions
import { saveDbAction } from './dbActions';


const exchangeService = new ExchangeService();

const connectExchangeService = (state: RootReducerState) => {
  const {
    oAuthTokens: { data: oAuthTokens },
    exchange: { data: { connectedProviders } },
  } = state;

  const { extra: shapeshiftAccessToken } = connectedProviders
    .find(({ id: providerId }) => providerId === PROVIDER_SHAPESHIFT) || {};
  // proceed with new instance only if one is not running and access token changed
  if (exchangeService.connected()) {
    const {
      accessToken: existingAccessToken,
      shapeshiftAccessToken: existingShapeshiftToken,
    } = exchangeService.tokens || {};
    if (existingAccessToken === oAuthTokens.accessToken
      && existingShapeshiftToken === shapeshiftAccessToken) return;
  }
  // $FlowFixMe oAuthTokens can be null
  exchangeService.connect(oAuthTokens.accessToken, shapeshiftAccessToken);
};

export const takeOfferAction = (
  fromAsset: Asset,
  toAsset: Asset,
  fromAmount: number,
  provider: string,
  trackId: string,
  callback: Function,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    connectExchangeService(getState());
    const {
      accounts: { data: accounts },
    } = getState();

    const clientAddress = toChecksumAddress(getSmartWalletAddress(accounts));

    let order;
    if (provider === 'UNISWAPV2-SHIM') {
      order = await createUniswapOrder(fromAsset, toAsset, fromAmount, clientAddress);
    } else if (provider === 'ONEINCH-SHIM') {
      order = await create1inchOrder(fromAsset, toAsset, fromAmount, clientAddress);
    }

    if (!fromAsset || !toAsset || !order) {
      Toast.show({
        title: 'Exchange service failed',
        type: 'warning',
        message: 'Could not find asset',
      });
      callback({});
      return;
    }

    const { address: fromAssetAddress } = fromAsset;
    const { decimals: fromAssetDecimals } = fromAsset;

    const transactionData = {
      fromAsset,
      toAsset,
      from: getSmartWalletAddress(accounts),
      payQuantity: fromAmount,
      amount: fromAmount,
      symbol: fromAsset.symbol,
      contractAddress: fromAssetAddress || '',
      decimals: parseInt(fromAssetDecimals, 10) || 18,
      ...order.transactionObj,

    };
    callback(transactionData);
  };
};

export const resetOffersAction = () => {
  return async (dispatch: Dispatch) => {
    // reset websocket listener
    exchangeService.resetOnOffers();
    dispatch({ type: RESET_OFFERS });
  };
};

const searchUniswapAction = (fromAsset: Asset, toAsset: Asset, fromAmount: number) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      exchange: { data: { allowances = [] } },
    } = getState();

    const offer = await getUniswapOffer(allowances, fromAsset, toAsset, fromAmount);
    dispatch({ type: ADD_OFFER, payload: offer });
  };
};

const search1inchAction = (fromAsset: Asset, toAsset: Asset, fromAmount: number) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
    } = getState();
    const address = getSmartWalletAddress(accounts);

    const offer = await get1inchOffer(fromAsset, toAsset, fromAmount, address);
    dispatch({ type: ADD_OFFER, payload: offer });
  };
};

export const searchOffersAction = (fromAssetCode: string, toAssetCode: string, fromAmount: number) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      exchange: { exchangeSupportedAssets },
    } = getState();

    // let's put values to reducer in order to see the previous offers and search values after app gets locked
    dispatch({
      type: SET_EXCHANGE_SEARCH_REQUEST,
      payload: {
        fromAssetCode,
        toAssetCode,
        fromAmount,
      },
    });

    const fromAsset = exchangeSupportedAssets.find(a => a.symbol === fromAssetCode);
    const toAsset = exchangeSupportedAssets.find(a => a.symbol === toAssetCode);
    if (!fromAsset || !toAsset) {
      Toast.show({
        title: 'Exchange Service',
        type: 'warning',
        message: 'Sorry, we could not find the asset. Could you please check and try again?',
      });
      return;
    }

    dispatch(search1inchAction(fromAsset, toAsset, fromAmount));
    dispatch(searchUniswapAction(fromAsset, toAsset, fromAmount));
  };
};

export const authorizeWithShapeshiftAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    connectExchangeService(getState());
    const shapeshiftAuthUrl = exchangeService.getShapeshiftAuthUrl();
    return Linking.canOpenURL(shapeshiftAuthUrl)
      .then((supported) => {
        if (supported) Linking.openURL(shapeshiftAuthUrl);
      })
      .catch(() => {
        Toast.show({
          title: 'Shapeshift authorize failed',
          type: 'warning',
          message: 'Cannot get authorize url',
        });
      });
  };
};

export const addConnectedExchangeProviderAction = (providerId: string, extra?: any) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { exchange: { data: { connectedProviders } } } = getState();
    const provider = {
      id: providerId,
      dateConnected: +new Date(),
      extra,
    };
    const updatedProviders = [
      ...connectedProviders,
      provider,
    ];
    dispatch({
      type: ADD_CONNECTED_EXCHANGE_PROVIDER,
      payload: provider,
    });
    Toast.show({
      title: 'Success',
      type: 'success',
      message: 'You have connected ShapeShift',
    });
    dispatch(saveDbAction('exchangeProviders', {
      connectedProviders: updatedProviders,
    }, true));
  };
};

export const disconnectExchangeProviderAction = (id: string) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { exchange: { data: { connectedProviders } } } = getState();
    const updatedProviders = connectedProviders.filter(({ id: providerId }) => providerId !== id);
    dispatch({
      type: REMOVE_CONNECTED_EXCHANGE_PROVIDER,
      payload: id,
    });
    Toast.show({
      title: 'Success',
      type: 'success',
      message: 'You have disconnected ShapeShift',
    });
    dispatch(saveDbAction('exchangeProviders', {
      connectedProviders: updatedProviders,
    }, true));
  };
};

export const requestShapeshiftAccessTokenAction = (tokenHash: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    connectExchangeService(getState());
    const { token: shapeshiftAccessToken, error } = await exchangeService.getShapeshiftAccessToken(tokenHash) || {};
    if (error || !shapeshiftAccessToken) {
      Toast.show({
        title: 'Shapeshift authorize failed',
        type: 'warning',
        message: 'Cannot get Shapeshift access token',
      });
      return;
    }
    dispatch(addConnectedExchangeProviderAction(PROVIDER_SHAPESHIFT, shapeshiftAccessToken));
  };
};

export const setExecutingTransactionAction = () => ({
  type: SET_EXECUTING_TRANSACTION,
});

export const setDismissTransactionAction = () => ({
  type: SET_DISMISS_TRANSACTION,
});

export const setTokenAllowanceAction = (
  formAssetCode: string,
  fromAssetAddress: string,
  toAssetAddress: string,
  provider: string,
  trackId: string,
  callback: Function,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    connectExchangeService(getState());

    const {
      accounts: { data: accounts },
      assets: { supportedAssets },
    } = getState();

    const activeWalletId = getPreferredWalletId(accounts);

    const allowanceRequest = {
      provider,
      fromAssetAddress,
      toAssetAddress,
      walletId: activeWalletId,
    };
    const response = await exchangeService.setTokenAllowance(allowanceRequest, trackId);

    if (!response || !response.data || response.error) {
      Toast.show({
        title: 'Exchange service failed',
        type: 'warning',
        message: 'Unable to set token allowance',
      });
      callback({}); // let's return callback to dismiss loading spinner on offer card button
      return;
    }
    const { data: { to: payToAddress, data, gasLimit } } = response;
    const asset = supportedAssets.find(a => a.symbol === formAssetCode);
    const from = getSmartWalletAddress(accounts);
    const transactionPayload = {
      from,
      to: payToAddress,
      data,
      symbol: formAssetCode,
      contractAddress: asset ? asset.address : '',
      decimals: asset ? asset.decimals : 18,
      amount: 0,
    };
    callback({
      gasLimit,
      data,
      payToAddress,
      transactionObj: {
        data,
      },
      transactionPayload,
    });
  };
};

export const addExchangeAllowanceAction = (
  provider: string,
  fromAssetCode: string,
  toAssetCode: string,
  transactionHash: string,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { exchange: { data: { allowances: _allowances = [] } } } = getState();
    const allowance = {
      provider,
      fromAssetCode,
      toAssetCode,
      transactionHash,
      enabled: false,
    };

    // filter pending for current provider and asset match to override failed transactions
    const allowances = _allowances
      .filter(({ provider: _provider, fromAssetCode: _fromAssetCode, toAssetCode: _toAssetCode }) =>
        fromAssetCode !== _fromAssetCode && toAssetCode !== _toAssetCode && provider !== _provider,
      );

    allowances.push(allowance);

    dispatch({
      type: ADD_EXCHANGE_ALLOWANCE,
      payload: allowance,
    });
    dispatch(saveDbAction('exchangeAllowances', { allowances }, true));
  };
};

export const enableExchangeAllowanceByHashAction = (transactionHash: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { exchange: { data: { allowances: _allowances = [] } } } = getState();
    const allowance = _allowances.find(
      ({ transactionHash: _transactionHash }) => _transactionHash === transactionHash,
    );
    if (!allowance) return;
    const updatedAllowance = {
      ...allowance,
      enabled: true,
    };
    dispatch({
      type: UPDATE_EXCHANGE_ALLOWANCE,
      payload: updatedAllowance,
    });
    const allowances = _allowances
      .filter(
        ({ transactionHash: _transactionHash }) => _transactionHash !== transactionHash,
      );
    allowances.push(updatedAllowance);
    dispatch(saveDbAction('exchangeAllowances', { allowances }, true));
  };
};

export const checkEnableExchangeAllowanceTransactionsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      history: {
        data: transactionsHistory,
      },
      exchange: {
        data: {
          allowances: exchangeAllowances,
        },
      },
    } = getState();
    const accountIds = Object.keys(transactionsHistory);
    const allHistory = accountIds.reduce(
      (existing = [], accountId) => {
        const walletAssetsHistory = transactionsHistory[accountId] || [];
        return [...existing, ...walletAssetsHistory];
      },
      [],
    );
    exchangeAllowances
      .filter(({ enabled }) => !enabled)
      .map(({ transactionHash, fromAssetCode, toAssetCode }) => {  // eslint-disable-line
        const enabledAllowance = allHistory.find(
          // $FlowFixMe
          ({ hash, status }) => hash === transactionHash && status === TX_CONFIRMED_STATUS,
        );
        if (enabledAllowance) {
          Toast.show({
            message: `${fromAssetCode} to ${toAssetCode} exchange was enabled`,
            type: 'success',
            title: 'Success',
            autoClose: true,
          });
          dispatch(enableExchangeAllowanceByHashAction(transactionHash));
        }
      });
  };
};

export const markNotificationAsSeenAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: MARK_NOTIFICATION_SEEN,
    });
  };
};

export const getMetaDataAction = () => {
  return async (dispatch: Dispatch) => {
    const metaData = await exchangeService.getMetaData();
    dispatch({
      type: SET_EXCHANGE_PROVIDERS_METADATA,
      payload: metaData,
    });
    dispatch(saveDbAction('exchangeProvidersInfo', { exchangeProvidersInfo: metaData }, true));
  };
};

export const getExchangeSupportedAssetsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      assets: { supportedAssets },
    } = getState();

    const exchangeSupportedAssetsTickers = await exchangeService.getExchangeSupportedAssets();

    const exchangeSupportedAssets = supportedAssets
      .filter(({ symbol }) => exchangeSupportedAssetsTickers.includes(symbol));

    dispatch({
      type: SET_EXCHANGE_SUPPORTED_ASSETS,
      payload: exchangeSupportedAssets,
    });

    dispatch(saveDbAction('exchangeSupportedAssets', { exchangeSupportedAssets }, true));
  };
};
