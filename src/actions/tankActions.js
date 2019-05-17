// @flow
export const fundTankAction = (value: number) => {
  return async (dispatch: Function, getState: Function) => {
    const { tank: { data: tankData } } = getState();
    const { totalStake, availableStake } = tankData;
    const updatedTankData = {
      totalStake: totalStake + value,
      availableStake: availableStake + value,
    };

    dispatch({
      type: 'FUND_TANK',
      payload: updatedTankData,
    });
  };
};

