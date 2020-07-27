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
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';

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
import { getActiveAccountAddress } from 'utils/accounts';
import { getPreferredWalletId } from 'utils/smartWallet';
import { reportLog } from 'utils/common';

// selectors
import { isActiveAccountSmartWalletSelector } from 'selectors/smartWallet';

// services
import ExchangeService from 'services/exchange';
import { getOffer } from 'services/uniswap';

// types
import type SDKWrapper from 'services/api';
import type { Offer, OfferOrder } from 'models/Offer';
import type { Dispatch, GetState, RootReducerState } from 'reducers/rootReducer';
import type { Asset } from 'models/Asset';

// config
import { EXCLUDED_SMARTWALLET_PROVIDERS, EXCLUDED_KEYWALLET_PROVIDERS } from 'configs/exchangeConfig';

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
  fromAssetCode: string,
  toAssetCode: string,
  fromAmount: number,
  provider: string,
  trackId: string,
  callback: Function,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    connectExchangeService(getState());
    const {
      accounts: { data: accounts },
      exchange: { exchangeSupportedAssets },
    } = getState();

    const fromAsset = exchangeSupportedAssets.find(a => a.symbol === fromAssetCode);
    const toAsset = exchangeSupportedAssets.find(a => a.symbol === toAssetCode);

    const activeWalletId = getPreferredWalletId(accounts);
    if (!fromAsset || !toAsset) {
      Toast.show({
        title: 'Exchange service failed',
        type: 'warning',
        message: 'Could not find asset',
      });
      callback({});
      return;
    }

    let { address: fromAssetAddress } = fromAsset;
    const { decimals: fromAssetDecimals } = fromAsset;
    let { address: toAssetAddress } = toAsset;

    // we need PROD assets' addresses in order to get offers when on ropsten network
    // as v2 requests require to provide addresses not tickers
    if (__DEV__) {
      const prodAssetsAddress = await exchangeService.getProdAssetsAddress();
      fromAssetAddress = prodAssetsAddress[fromAssetCode];
      toAssetAddress = prodAssetsAddress[toAssetCode];
    }

    const offerRequest = {
      quantity: parseFloat(fromAmount),
      provider,
      fromAssetAddress,
      toAssetAddress,
      walletId: activeWalletId,
    };
    const order = await exchangeService.takeOffer(offerRequest, trackId);
    const offerOrderData = get(order, 'data');
    if (isEmpty(offerOrderData) || order.error) {
      let { message = 'Unable to request offer' } = order.error || {};
      if (message.toString().toLowerCase().includes('kyc')) {
        message = 'Shapeshift KYC must be complete in order to proceed';
      }
      Toast.show({
        title: 'Exchange service failed',
        type: 'warning',
        message,
      });
      callback({}); // let's return callback to dismiss loading spinner on offer card button
      return;
    }
    const {
      payToAddress,
      payQuantity,
    }: OfferOrder = offerOrderData;
    const transactionDataString = get(offerOrderData, 'transactionObj.data');

    const from = getActiveAccountAddress(accounts);
    const transactionPayload = {
      from,
      to: payToAddress,
      data: transactionDataString,
      amount: payQuantity,
      symbol: fromAssetCode,
      contractAddress: fromAssetAddress || '',
      decimals: parseInt(fromAssetDecimals, 10) || 18,
    };
    callback({
      ...offerOrderData,
      transactionPayload,
    });
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

    const offer = await getOffer(allowances, fromAsset, toAsset, fromAmount);
    dispatch({ type: ADD_OFFER, payload: offer });
  };
};

export const searchOffersAction = (fromAssetCode: string, toAssetCode: string, fromAmount: number) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: { walletId: userWalletId } },
      exchange: { exchangeSupportedAssets },
      accounts: { data: accounts },
    } = getState();

    const activeWalletId = getPreferredWalletId(accounts);
    const isSmartWallet = isActiveAccountSmartWalletSelector(getState());
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

    await dispatch(searchUniswapAction(fromAsset, toAsset, fromAmount));

    let { address: fromAddress } = fromAsset;
    let { address: toAddress } = toAsset;

    // we need PROD assets' addresses in order to get offers when on ropsten network
    // as v2 requests require to provide addresses not tickers
    if (__DEV__) {
      const prodAssetsAddress = await exchangeService.getProdAssetsAddress();
      fromAddress = prodAssetsAddress[fromAssetCode];
      toAddress = prodAssetsAddress[toAssetCode];
    }

    const excludedProviders = isSmartWallet ? EXCLUDED_SMARTWALLET_PROVIDERS : EXCLUDED_KEYWALLET_PROVIDERS;

    connectExchangeService(getState());
    exchangeService.onOffers(offers =>
      offers
        .filter(({ askRate, provider }) => !!askRate && !excludedProviders.includes(provider))
        .map((offer: Offer) => dispatch({ type: ADD_OFFER, payload: offer })),
    );
    // we're requesting although it will start delivering when connection is established
    const response = await exchangeService.requestOffers(fromAddress, toAddress, fromAmount, activeWalletId);
    const responseError = get(response, 'error');

    if (responseError) {
      const responseErrorMessage = get(responseError, 'response.data.error.message');
      const message = responseErrorMessage || 'Unable to connect - please try again.';
      if (message.toString().toLowerCase().startsWith('access token')) {
        /**
         * access token is expired or malformed,
         * let's hit with user info endpoint to update access tokens
         * or redirect to pin screen (logic being sdk init)
         * after it's complete (access token's updated) let's dispatch same action again
         * TODO: change SDK user info endpoint to simple SDK token refresh method when it is reachable within SDK
         */
        await api.userInfo(userWalletId)
          .catch(error => reportLog(error.message));
      } else {
        Toast.show({
          title: 'Exchange service failed',
          type: 'warning',
          message,
        });
      }
    }
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
    const from = getActiveAccountAddress(accounts);
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
