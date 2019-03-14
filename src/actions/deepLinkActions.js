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
import url from 'url';
import Toast from 'components/Toast';
import { updateNavigationLastScreenState, navigate, getNavigationPathAndParamsState } from 'services/navigation';
import { HOME, APP_FLOW, AUTH_FLOW } from 'constants/navigationConstants';
import { ADD_DEEP_LINK_DATA, RESET_DEEP_LINK_DATA } from 'constants/deepLinkConstants';

export const executeDeepLinkAction = (deepLink: string) => {
  return async (dispatch: Function) => {
    const params: Object = url.parse(deepLink, true);
    if (params.protocol !== 'pillarwallet:') return;
    if (params.host === 'approve') {
      const { query: { loginToken: loginAttemptToken } } = params;
      dispatch({
        type: ADD_DEEP_LINK_DATA,
        payload: { loginAttemptToken },
      });
      const pathAndParams = getNavigationPathAndParamsState();
      if (!pathAndParams) {
        updateNavigationLastScreenState({
          lastActiveScreen: HOME,
          lastActiveScreenParams: {},
        });
        return;
      }
      const pathParts = pathAndParams.path.split('/');
      const currentFlow = pathParts[0];
      const currentScreen = pathParts[pathAndParams.path.length - 1];
      if (currentScreen !== HOME) {
        updateNavigationLastScreenState({
          lastActiveScreen: HOME,
          lastActiveScreenParams: {},
        });
        if (currentFlow !== AUTH_FLOW) {
          const navigateToAppAction = NavigationActions.navigate({
            routeName: APP_FLOW,
            params: {},
            action: NavigationActions.navigate({
              routeName: HOME,
              params: {},
            }),
          });
          navigate(navigateToAppAction);
        }
      }
    }
  };
};

export const resetDeepLinkDataAction = () => {
  return async (dispatch: Function) => {
    dispatch({ type: RESET_DEEP_LINK_DATA });
  };
};

export const approveLoginAttemptAction = (loginAttemptToken: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    try {
      const result = await api.approveLoginToExternalResource(loginAttemptToken);
      if (!result || result.error) throw new Error();
      dispatch({ type: RESET_DEEP_LINK_DATA });
    } catch (e) {
      Toast.show({
        message: 'Failed to approve your login, please try again.',
        type: 'warning',
        title: 'Something gone wrong',
      });
    }
  };
};
