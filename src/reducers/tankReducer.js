// @flow
import { TOGGLE_TANK_MODAL } from 'constants/tankConstants';

export type TankReducerState = {
  data: Object,
  isModalVisible: boolean,
};

export type TankReducerAction = {
  type: string,
  payload: any,
};

const initialState = {
  data: {
    totalStake: 13500,
    availableStake: 7350,
  },
  isModalVisible: false,
};

export default function badgesReducer(
  state: TankReducerState = initialState,
  action: TankReducerAction,
) {
  switch (action.type) {
    case TOGGLE_TANK_MODAL:
      return {
        ...state,
        isModalVisible: !state.isModalVisible,
      };
    default:
      return state;
  }
}
