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
import {
  ADD_OFFER,
  RESET_OFFERS,
  SET_EXCHANGE_SEARCH_REQUEST,
  SET_EXECUTING_TRANSACTION,
  SET_DISMISS_TRANSACTION,
  SET_EXCHANGE_ALLOWANCES,
  ADD_EXCHANGE_ALLOWANCE,
  UPDATE_EXCHANGE_ALLOWANCE,
  MARK_NOTIFICATION_SEEN,
  SET_EXCHANGE_SUPPORTED_ASSETS,
  SET_FIAT_EXCHANGE_SUPPORTED_ASSETS,
  SET_UNISWAP_TOKENS_QUERY_STATUS,
  UNISWAP_TOKENS_QUERY_STATUS,
} from 'constants/exchangeConstants';
import type { Offer, ExchangeSearchRequest, Allowance } from 'models/Offer';
import type { Asset } from 'models/Asset';

export type ExchangeReducerState = {
  data: {
    offers: Offer[],
    searchRequest?: ExchangeSearchRequest,
    executingTransaction: boolean,
    allowances: Allowance[],
    hasNotification: boolean,
  },
  exchangeSupportedAssets: Asset[],
  fiatExchangeSupportedAssets: Asset[],
  isFetchingUniswapTokens: boolean,
  uniswapTokensGraphQueryFailed: boolean,
}

type SetUniswapTokensQueryStatusAction = {
  type: typeof SET_UNISWAP_TOKENS_QUERY_STATUS,
  payload: { status: $Keys<typeof UNISWAP_TOKENS_QUERY_STATUS> },
};

export type ExchangeReducerAction = {
  type: string,
  payload: any,
} | SetUniswapTokensQueryStatusAction;

export const initialState = {
  data: {
    offers: [],
    executingTransaction: false,
    allowances: [],
    hasNotification: false,
  },
  exchangeSupportedAssets: [],
  fiatExchangeSupportedAssets: [],
  isFetchingUniswapTokens: false,
  uniswapTokensGraphQueryFailed: false,
};

export default function exchangeReducer(
  state: ExchangeReducerState = initialState,
  action: ExchangeReducerAction,
): ExchangeReducerState {
  switch (action.type) {
    case RESET_OFFERS:
      return {
        ...state,
        data: {
          ...state.data,
          offers: [],
        },
      };
    case ADD_OFFER:
      return {
        ...state,
        data: {
          ...state.data,
          offers: [
            ...state.data.offers.filter(offer => offer._id !== action.payload._id),
            action.payload,
          ],
        },
      };
    case SET_EXCHANGE_SEARCH_REQUEST:
      return {
        ...state,
        data: {
          ...state.data,
          searchRequest: action.payload,
        },
      };
    case SET_EXECUTING_TRANSACTION:
      return {
        ...state,
        data: {
          ...state.data,
          executingTransaction: true,
        },
      };
    case SET_DISMISS_TRANSACTION:
      return {
        ...state,
        data: {
          ...state.data,
          executingTransaction: false,
        },
      };
    case SET_EXCHANGE_ALLOWANCES:
      return {
        ...state,
        data: {
          ...state.data,
          allowances: action.payload,
        },
      };
    case ADD_EXCHANGE_ALLOWANCE:
      return {
        ...state,
        data: {
          ...state.data,
          allowances: [
            ...state.data.allowances,
            action.payload,
          ],
          hasNotification: true,
        },
      };
    case UPDATE_EXCHANGE_ALLOWANCE:
      const {
        transactionHash,
      } = action.payload || {};
      return {
        ...state,
        data: {
          ...state.data,
          allowances: [
            ...state.data.allowances.filter(
              ({ transactionHash: _transactionHash }) => _transactionHash !== transactionHash,
            ),
            action.payload,
          ],
          hasNotification: true,
        },
      };
    case MARK_NOTIFICATION_SEEN:
      return {
        ...state,
        data: {
          ...state.data,
          hasNotification: false,
        },
      };
    case SET_EXCHANGE_SUPPORTED_ASSETS:
      return {
        ...state,
        exchangeSupportedAssets: action.payload,
      };
    case SET_FIAT_EXCHANGE_SUPPORTED_ASSETS:
      return {
        ...state,
        fiatExchangeSupportedAssets: action.payload,
      };
    case SET_UNISWAP_TOKENS_QUERY_STATUS:
      return (action.payload.status === UNISWAP_TOKENS_QUERY_STATUS.FETCHING)
        ? { ...state, isFetchingUniswapTokens: true }
        : {
          ...state,
          isFetchingUniswapTokens: false,
          uniswapTokensGraphQueryFailed: action.payload.status === UNISWAP_TOKENS_QUERY_STATUS.ERROR,
        };

    default:
      return state;
  }
}
