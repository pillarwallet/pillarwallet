// @flow
import { UPDATE_ASSET, UPDATE_ASSETS_STATE, FETCHING, ETH } from 'constants/assetsConstants';
import reducer from '../assetsReducer';

describe('Assets reducer', () => {
  it('should handle UPDATE_ASSET', () => {
    const updateAction = { type: UPDATE_ASSET, payload: { symbol: ETH, balance: 5 } };
    const expectedAssets = {
      data: {
        [ETH]: {
          symbol: ETH,
          balance: 5,
        },
      },
    };
    expect(reducer(undefined, updateAction)).toMatchObject(expectedAssets);
  });

  it('should handle UPDATE_ASSET_STATE', () => {
    const updateAction = { type: UPDATE_ASSETS_STATE, payload: FETCHING };
    expect(reducer(undefined, updateAction)).toMatchObject({ assetsState: FETCHING });
  });
});
