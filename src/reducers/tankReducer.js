// @flow
export type TankReducerState = {
  data: Object,
};

export type TankReducerAction = {
  type: string,
  payload: any,
};

const initialState = {
  data: {
    totalStake: 10,
  },
};

export default function tankReducer(
  state: TankReducerState = initialState,
  action: TankReducerAction,
) {
  switch (action.type) {
    default:
      return state;
  }
}
