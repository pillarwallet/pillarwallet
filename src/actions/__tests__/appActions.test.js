// @flow
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { initAppAndRedirectAction } from '../appActions';

const mockStore = configureMockStore([thunk]);
describe('App actions', () => {
  let store;
  beforeEach(() => {
    store = mockStore({});
  });

  it(`initAppAndRedirectAction - should trigger the app settings updated 
  with any redirection due to the empty storage`, () => {
    const expectedActions = [
      { type: UPDATE_APP_SETTINGS, payload: {} },
    ];

    return store.dispatch(initAppAndRedirectAction('ios', 'active'))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
