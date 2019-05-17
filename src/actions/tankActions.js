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

export const settleNetwokAssetsBalanceAction = (assetsToSettle: Object[]) => {
  return async (dispatch: Function, getState: Function) => {
    const { tank: { assetsOnNetwork } } = getState();
    const assetsToSettleSymbols = assetsToSettle.map(asset => asset.symbol);

    const updatedAssetsOnNetwork = assetsOnNetwork.filter((asset) => !assetsToSettleSymbols.includes(asset.symbol));

    dispatch({
      type: 'SETTLE_ASSETS',
      payload: updatedAssetsOnNetwork,
    });
  };
};

