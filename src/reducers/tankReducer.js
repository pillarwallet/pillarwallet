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
  assetsOnNetwork: [
    {
      name: 'Ethereum',
      symbol: 'ETH',
      iconUrl: 'asset/images/tokens/icons/ethColor.png',
      amount: 0.35,
      mockInFiat: 26.42,
    },
    {
      name: 'Dai',
      symbol: 'DAI',
      iconUrl: 'asset/images/tokens/icons/daiColor.png',
      amount: 48.65,
      mockInFiat: 42.3,
    },
    {
      name: '0x Project',
      symbol: 'ZRX',
      iconUrl: 'asset/images/tokens/icons/zrxColor.png',
      amount: 360.5,
      mockInFiat: 95.7,
    },
  ],
};

export default function badgesReducer(
  state: TankReducerState = initialState,
  action: TankReducerAction,
) {
  switch (action.type) {
    case 'SETTLE_ASSETS':
      return {
        ...state,
        assetsOnNetwork: action.payload,
      };
    default:
      return state;
  }
}
