// @flow
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { ONBOARDING_FLOW } from 'constants/navigationConstants';
import Storage from 'services/storage';
import { confirmOTPAction } from '../signupActions';

const storage = Storage.getInstance('db'); // should utilise db from config once setup

const NAVIGATE = 'Navigation/NAVIGATE';
const mockStore = configureMockStore([thunk]);
const store = mockStore({});
describe('Signup actions', () => {
  it('should expect series of actions to be dispatch on confirmOTPAction execution including storage update', () => {
    const expectedActions = [
      { type: NAVIGATE, routeName: ONBOARDING_FLOW },
    ];

    return store.dispatch(confirmOTPAction('1111'))
      .then(() => {
        const actualActions = store.getActions();
        expect(actualActions).toEqual(expectedActions);
        return storage.get('app_settings');
      }).then((appSettings) => {
        expect(appSettings.OTP).toBeTruthy();
      });
  });
});
