// @flow
import { ONBOARDING_FLOW, SET_INITIAL_ROUTE } from 'constants/navigationConstants';
import RootNavigation from 'navigation/rootNavigation';

type NavigationReducerState = {
  index: number,
  isTransitioning: boolean,
  routes: Object[],
  activeScreen: ?string,
  prevActiveScreen: ?string,
}

export type NavigationReducerAction = {
  type: string,
  payload: any,
  action: {
    routeName: string,
    params: Object,
  },
  key: ?string,
}

const initialState = {
  ...RootNavigation.router.getStateForAction(
    RootNavigation.router.getActionForPathAndParams(ONBOARDING_FLOW),
  ),
  activeScreen: null,
  prevActiveScreen: null,
};

const NAVIGATION_ACTION = 'Navigation';
const NAVIGATION_COMPLETE_TRANSITION = 'Navigation/COMPLETE_TRANSITION';

function navigationReducer(state: NavigationReducerState = initialState, action: NavigationReducerAction) {
  if (action.type === SET_INITIAL_ROUTE) {
    return { ...state, activeScreen: action.payload };
  }
  if (action.type && action.type.includes(NAVIGATION_ACTION)) {
    let newActiveScreen = (action.action ? action.action.routeName : action.routeName) || action.key;
    let newPrevActiveScreen = state.activeScreen;
    const nextState = RootNavigation.router.getStateForAction(action, state) || state;
    if (action.type === NAVIGATION_COMPLETE_TRANSITION) {
      newActiveScreen = state.activeScreen;
      newPrevActiveScreen = state.prevActiveScreen;
    }
    return {
      ...nextState,
      activeScreen: newActiveScreen,
      prevActiveScreen: newPrevActiveScreen,
    };
  }
  return state;
}

export default navigationReducer;
