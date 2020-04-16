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

type LastActiveScreenState = {
  lastActiveScreen: ?string,
  lastActiveScreenParams?: Object,
}

let _navigator;

let _state = {
  lastActiveScreen: null,
  lastActiveScreenParams: null,
};

export function setTopLevelNavigator(navigatorRef: Object) {
  _navigator = navigatorRef;
}

export function navigate(routeName: string | Object, params?: Object) {
  if (!_navigator) return;
  const route = typeof routeName === 'object'
    ? routeName
    : NavigationActions.navigate({
      routeName,
      params,
    });
  _navigator.dispatch(route);
}

export function getNavigationState() {
  return {
    ..._state,
    navigator: _navigator,
  };
}

export function getNavigationPathAndParamsState() {
  if (!_navigator) return null;
  return _navigator._navigation.router.getPathAndParamsForState(_navigator._navigation.state);
}

export function getActionForPathAndParams(path: string, params: Object) {
  if (!_navigator) return null;
  return _navigator._navigation.router.getActionForPathAndParams(path, params);
}

export function updateNavigationLastScreenState({
  lastActiveScreen,
  lastActiveScreenParams = {},
}: LastActiveScreenState) {
  _state = {
    lastActiveScreen,
    lastActiveScreenParams,
  };
}
