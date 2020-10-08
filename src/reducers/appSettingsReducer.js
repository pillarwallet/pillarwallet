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
import merge from 'lodash.merge';
import { UPDATE_APP_SETTINGS, RESET_APP_SETTINGS, RESET_APP_LOADED } from 'constants/appSettingsConstants';
import { SIMPLIFIED } from 'constants/assetsLayoutConstants';
import type { LocalisationOptions } from 'models/Translations';

export type AppSettingsReducerState = {
  data: {
    lastTxSyncDatetimes: Object,
    appearanceSettings: {
      assetsLayout: string,
    },
    blockchainNetwork: ?string,
    baseFiatCurrency: ?string,
    transactionSpeed: ?string,
    themeType: string,
    isManualThemeSelection: boolean,
    useBiometrics?: boolean,
    optOutTracking?: boolean,
    hasSeenExchangeIntro?: boolean,
    hideBalance?: boolean,
    hasDismissedConnectAppsIntro?: boolean,
    hideBadges?: boolean,
    hidePoolTogether?: boolean,
    hideSablier?: boolean,
    preferredGasToken: ?string,
    initialDeeplinkExecuted: boolean,
    hasSeenRecoveryPortalIntro?: boolean,
    hideLendingDeposits?: boolean,
    omitPinOnLogin: boolean,
    localisation: ?LocalisationOptions,
  },
  isFetched: boolean,
};

export type AppSettingsReducerAction = {
  type: string,
  payload: Object,
};

export const initialState: AppSettingsReducerState = {
  data: {
    lastTxSyncDatetimes: {},
    appearanceSettings: {
      assetsLayout: SIMPLIFIED,
    },
    blockchainNetwork: null,
    baseFiatCurrency: null,
    transactionSpeed: null,
    themeType: '',
    isManualThemeSelection: false,
    useBiometrics: false,
    hasSeenExchangeIntro: false,
    hideBalance: false,
    hasDismissedConnectAppsIntro: false,
    hideBadges: false,
    hidePoolTogether: false,
    hideSablier: false,
    preferredGasToken: null,
    initialDeeplinkExecuted: false,
    hasSeenRecoveryPortalIntro: false,
    hideLendingDeposits: false,
    omitPinOnLogin: false,
    localisation: null,
  },
  isFetched: false,
};

const appSettingsReducer = (
  state: AppSettingsReducerState = initialState,
  action: AppSettingsReducerAction,
): AppSettingsReducerState => {
  switch (action.type) {
    case UPDATE_APP_SETTINGS:
      const updatedState = { data: action.payload, isFetched: true };
      return merge(
        {},
        state,
        updatedState,
      );

    case RESET_APP_SETTINGS:
      return { ...state, data: { ...initialState.data } };

    case RESET_APP_LOADED:
      return { ...state, isFetched: false };

    default:
      return state;
  }
};

export default appSettingsReducer;
