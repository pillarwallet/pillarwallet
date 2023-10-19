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

import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';

type LastActiveScreenState = {
  lastActiveScreen: ?string,
  lastActiveScreenParams?: Object,
};

export const navigationRef = createNavigationContainerRef();

let _state = {
  lastActiveScreen: null,
  lastActiveScreenParams: null,
};

let routesState = null;
let lastRouteState = null;

export const NavigationActions = navigationRef;

export function navigate(routeName: string | Object, params?: Object) {
  if (!navigationRef.isReady()) return;

  const route = typeof routeName === 'object' ? routeName : CommonActions.navigate({ name: routeName, params });
  navigationRef.dispatch(route);
}

export function getNavigationState() {
  return {
    ..._state,
    navigator: navigationRef,
  };
}

export function getNavigationPathAndParamsState() {
  if (!navigationRef.isReady()) return null;
  return navigationRef.getCurrentRoute();
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
export function setRoutesState(state: any) {
  routesState = state;
}

export function getRoutesState() {
  return routesState;
}

export function setLastRouteState() {
  lastRouteState = routesState;
}

export function getLastRouteState() {
  return lastRouteState;
}
