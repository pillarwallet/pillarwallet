// @flow
import type { NavigationAction, NavigationState } from 'react-navigation';

import RootSwitch from 'navigation/rootNavigation';
import { HOME } from '../constants/navigationConstants';

const initialStateAction: NavigationAction = RootSwitch.router.getActionForPathAndParams(HOME);
const initialState: NavigationState = RootSwitch.router.getStateForAction(initialStateAction);

export default function navReducer(state: NavigationState = initialState, action: NavigationAction){
  const nextState = RootSwitch.router.getStateForAction(action, state);
  return nextState || state;
}
