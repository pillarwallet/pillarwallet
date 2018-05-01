// @flow
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fetchAppSettingsAndRedirectAction } from '../appSettingsActions';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';

const mockStore = configureMockStore([thunk]);
const store = mockStore({});
describe('App settings actions', () => {


  it(`should trigger the app settings updated with any redirection due to the empty storage`, () => {
    const expectedActions = [
      { type: UPDATE_APP_SETTINGS, payload: {} }
    ];

    return store.dispatch(fetchAppSettingsAndRedirectAction())
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
      });
  });
});
