// @flow
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { ONBOARDING_FLOW } from 'constants/navigationConstants';
import { UPDATE_USER, PENDING } from 'constants/userConstants';
import { initAppAndRedirectAction, fetchUserAction } from '../appActions';

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
      { routeName: ONBOARDING_FLOW, type: 'Navigation/NAVIGATE' },
    ];

    return store.dispatch(initAppAndRedirectAction())
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
  it('fetchUserAction - should fetch the user and update redux store', () => {
    const expectedActions = [
      { type: UPDATE_USER, payload: { state: PENDING, user: {} } },
    ];

    return store.dispatch(fetchUserAction())
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
