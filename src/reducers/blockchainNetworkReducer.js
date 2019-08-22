// @flow
import {
  BLOCKCHAIN_NETWORK_TYPES,
  SET_ACTIVE_NETWORK,
} from 'constants/blockchainNetworkConstants';

export type BlockchainNetworkReducerState = {
  data: Object[],
};

export type NetworkAction = {
  type: string,
  payload: any,
};

const initialState = {
  data: [
    {
      id: BLOCKCHAIN_NETWORK_TYPES.ETHEREUM,
      title: 'Ethereum',
      isActive: true,
    },
    {
      id: BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK,
      title: 'Pillar network',
      isActive: false,
    },
  ],
};

export default function blockchainNetworkReducer(
  state: BlockchainNetworkReducerState = initialState,
  action: NetworkAction,
): BlockchainNetworkReducerState {
  switch (action.type) {
    case SET_ACTIVE_NETWORK:
      return {
        ...state,
        data: state.data.map(({ id, ...rest }) => ({ id, ...rest, isActive: id === action.payload })),
      };
    default:
      return state;
  }
}
