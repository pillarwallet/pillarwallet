// @flow
import { TOGGLE_TANK_MODAL } from 'constants/tankConstants';

export const toggleTankModalAction = () => {
  return async (dispatch: Function) => {
    dispatch({ type: TOGGLE_TANK_MODAL });
  };
};
