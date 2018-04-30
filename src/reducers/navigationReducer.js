// @flow
import type { NavigationAction, NavigationState } from 'react-navigation';
import { NavigationActions } from 'react-navigation';

import RootSwitch from 'navigation/rootNavigation';
import { WELCOME } from '../constants/navigationConstants';

const initialState: NavigationState = RootSwitch.router.getStateForAction(NavigationActions.reset({
	index: 0,
	actions: [
	  NavigationActions.navigate({
		  routeName: WELCOME,
	  }),
	],
}));

export default function navReducer(state: NavigationState = initialState, action: NavigationAction) {
  const nextState = RootSwitch.router.getStateForAction(action, state);
  console.log(nextState, action);
  return nextState || state;
}
