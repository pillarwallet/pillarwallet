// @flow
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

