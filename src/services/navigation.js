// @flow

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
  return _state;
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
