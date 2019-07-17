// @flow
import {
  BLOCKCHAIN_NETWORK_TYPES,
  ADD_BLOCKCHAIN_NETWORK,
  SET_ACTIVE_NETWORK,
} from 'constants/blockchainNetworkConstants';

export type NetworkState = {
  data: Object[],
};

export type NetworkAction = {
  type: string,
  payload: any,
};

const initialState = {
  data: [{
    id: BLOCKCHAIN_NETWORK_TYPES.ETHEREUM,
    title: 'Ethereum',
    isActive: true,
  }],
};

export default function blockchainNetworkReducer(
  state: NetworkState = initialState,
  action: NetworkAction,
): NetworkState {
  switch (action.type) {
    case ADD_BLOCKCHAIN_NETWORK:
      return { ...state, data: [...state.data, action.payload] };
    case SET_ACTIVE_NETWORK:
      return {
        ...state,
        data: state.data.map(({ id, ...rest }) => ({ id, ...rest, isActive: id === action.payload })),
      };
    default:
      return state;
  }
}
