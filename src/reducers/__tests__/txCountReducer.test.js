// @flow
import { UPDATE_TX_COUNT } from 'constants/txCountConstants';
import reducer from '../txCountReducer';

describe('TxCount reducer', () => {
  it('should handle UPDATE_TX_COUNT', () => {
    const updateAction = { type: UPDATE_TX_COUNT, payload: { lastCount: 1, lastNonce: 1 } };
    const expectedAssets = {
      data: {
        lastCount: 1,
        lastNonce: 1,
      },
    };
    expect(reducer(undefined, updateAction)).toMatchObject(expectedAssets);
  });
});
