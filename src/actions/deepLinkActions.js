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

import { Alert } from 'react-native';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';

import { requestSessionAction } from 'actions/walletConnectActions';
import { initialDeeplinkExecuted } from 'actions/appSettingsActions';

// constants
import { CONFIRM_CLAIM } from 'constants/navigationConstants';

// services
import { updateNavigationLastScreenState } from 'services/navigation';

// utils
import { validateDeepLink } from 'utils/deepLink';

// types
import type { Dispatch } from 'reducers/rootReducer';


export const executeDeepLinkAction = (deepLink: string, onAppLaunch?: boolean) => {
  return async (dispatch: Dispatch) => {
    // make sure a deeplink is only handled once
    if (onAppLaunch) {
      dispatch(initialDeeplinkExecuted());
    }

    const validatedDeepLink = validateDeepLink(deepLink);
    if (isEmpty(validatedDeepLink)) return;
    const { action, query, protocol } = validatedDeepLink;

    if (protocol === 'wc:') {
      dispatch(requestSessionAction(deepLink));
      return;
    }

    // NOTE: actions (hosts) are parsed in lowercase
    switch (action) {
      case 'referral':
        const referralCode = get(query, 'code');
        if (referralCode) {
          updateNavigationLastScreenState({
            lastActiveScreen: CONFIRM_CLAIM,
            lastActiveScreenParams: { code: referralCode },
          });
        } else {
          Alert.alert(t('alert.invalidReferralDeepLink.title'), t('alert.invalidReferralDeepLink.message'));
        }
        break;
      case 'wc':
        let walletConnectUrl = get(query, 'url');
        if (walletConnectUrl) {
          const key = get(query, 'key');
          if (key) walletConnectUrl += `&key=${key}`;
          dispatch(requestSessionAction(walletConnectUrl));
        }
        break;
      default:
        break;
    }
  };
};
