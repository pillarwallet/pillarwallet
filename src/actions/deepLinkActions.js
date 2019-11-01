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
import { NavigationActions } from 'react-navigation';
import { Alert } from 'react-native';
import url from 'url';
import Toast from 'components/Toast';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import { updateNavigationLastScreenState, navigate } from 'services/navigation';
import { requestShapeshiftAccessTokenAction } from 'actions/exchangeActions';
import { LOGIN, CONFIRM_CLAIM, HOME } from 'constants/navigationConstants';
import { isNavigationAllowed } from 'utils/navigation';

import type SDKWrapper from 'services/api';
import type { Dispatch, GetState } from 'reducers/rootReducer';

type ApproveLoginQuery = {
  loginToken?: string,
};

const allowedDeepLinkProtocols = [
  'pillarwallet:',
];

const beginApproveLogin = (query: ApproveLoginQuery) => {
  const { loginToken: loginAttemptToken } = query;

  if (!isNavigationAllowed()) {
    updateNavigationLastScreenState({
      lastActiveScreen: LOGIN,
      lastActiveScreenParams: { loginAttemptToken },
    });
    return;
  }

  const navigateToAppAction = NavigationActions.navigate({
    routeName: LOGIN,
    params: { loginAttemptToken },
  });

  navigate(navigateToAppAction);
};

export const executeDeepLinkAction = (deepLink: string) => {
  return async (dispatch: Dispatch) => {
    const params = url.parse(deepLink, true);
    if (isEmpty(params)) return;
    const { host, protocol, query = {} } = params;
    if (!allowedDeepLinkProtocols.includes(protocol)) return;
    switch (host) {
      case 'referral':
        const referralCode = get(query, 'code');
        if (referralCode) {
          updateNavigationLastScreenState({
            lastActiveScreen: CONFIRM_CLAIM,
            lastActiveScreenParams: { code: referralCode },
          });
        } else {
          Alert.alert('Invalid link', 'Referral code is missing');
        }
        break;
      case 'approve':
        beginApproveLogin(query);
        break;
      case 'shapeshift':
        const shapeshiftTokenHash = get(query, 'auth');
        const authStatus = get(query, 'status');
        if (!authStatus || !shapeshiftTokenHash) break;
        dispatch(requestShapeshiftAccessTokenAction(shapeshiftTokenHash));
        break;
      default:
        break;
    }
  };
};

export const approveLoginAttemptAction = (loginAttemptToken: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    try {
      const result = await api.approveLoginToExternalResource(loginAttemptToken);
      if (!result || result.error) throw new Error();
      navigate(HOME);
      Toast.show({
        message: 'Your forum login was approved.',
        type: 'success',
        title: 'Success',
      });
    } catch (e) {
      Toast.show({
        message: 'Failed to approve your login, please try again.',
        type: 'warning',
        title: 'Something gone wrong',
      });
    }
  };
};
