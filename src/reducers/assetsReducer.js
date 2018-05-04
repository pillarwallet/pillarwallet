// @flow
import { UPDATE_ASSET, UPDATE_ASSETS_STATE } from 'constants/assetsConstants';
import merge from 'lodash.merge';

const cryptocurrencies = {
  ETH: {
    name: 'Ethereum',
    color: '#4C4E5E',
  },
  PLR: {
    name: 'Pillar',
    color: '#5e1b22',
  },
};

export type AssetsReducerState = {
  data: Object,
  assetsState: ?string
}

export type AssetsReducerAction = {
  type: string,
  payload: any
}

const initialState = {
  data: {},
  assetsState: null,
};

export default function assetsReducer(
  state: AssetsReducerState = initialState,
  action: AssetsReducerAction,
) {
  switch (action.type) {
    case UPDATE_ASSETS_STATE:
      return { ...state, assetsState: action.payload };
    case UPDATE_ASSET:
      const { id } = action.payload;
      const updatedState = {
        data: { [id]: { ...action.payload, ...cryptocurrencies[id] } },
      };
      return merge(
        {},
        state,
        updatedState,
      );
    default:
      return state;
  }
}
