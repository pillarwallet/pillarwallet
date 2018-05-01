// @flow
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import reducer from '../appSettingsReducer';

describe('Assets reducer', () => {
  it('should handle UPDATE_APP_SETTINGS', () => {
    const updateAction = { type: UPDATE_APP_SETTINGS, payload: { OTP: true } };
    const expectedAssets = {
      data: {
        OTP: true,
      },
      isFetched: true,
    };
    expect(reducer(undefined, updateAction)).toMatchObject(expectedAssets);
  });
});
