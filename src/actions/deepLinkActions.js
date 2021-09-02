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

import isEmpty from 'lodash.isempty';
import { Linking } from 'react-native';

// actions
import { connectToWalletConnectConnectorAction } from 'actions/walletConnectActions';
import { initialDeepLinkExecutedAction } from 'actions/appSettingsActions';

// utils
import { validateDeepLink } from 'utils/deepLink';
import { reportErrorLog } from 'utils/common';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';


export const executeDeepLinkAction = (deepLink: string) => {
  return (dispatch: Dispatch) => {
    const validatedDeepLink = validateDeepLink(deepLink);
    if (isEmpty(validatedDeepLink)) return;
    const { action, query, protocol } = validatedDeepLink;

    if (protocol === 'wc:' && !isEmpty(query)) {
      dispatch(connectToWalletConnectConnectorAction(deepLink));
      return;
    }

    // NOTE: actions (hosts) are parsed in lowercase
    switch (action) {
      case 'wc':
        let walletConnectUrl = query?.url || query?.uri;
        if (walletConnectUrl) {
          const key = query?.key;
          if (key) walletConnectUrl += `&key=${key}`; // eslint-disable-line i18next/no-literal-string
          dispatch(connectToWalletConnectConnectorAction(walletConnectUrl));
        }
        break;
      default:
        break;
    }
  };
};

export const checkInitialDeepLinkAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { initialDeepLinkExecuted } = getState().appSettings?.data ?? {};
    if (initialDeepLinkExecuted) return;

    dispatch(initialDeepLinkExecutedAction());

    try {
      const url = await Linking.getInitialURL();
      if (url) dispatch(executeDeepLinkAction(url));
    } catch (error) {
      reportErrorLog('checkInitialDeepLinkAction Linking.getInitialURL failed', { error });
    }
  };
};
