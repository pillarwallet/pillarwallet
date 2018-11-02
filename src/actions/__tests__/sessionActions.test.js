// @flow
import configureMockStore from 'redux-mock-store';
import ReduxAsyncQueue from 'redux-async-queue';
import { UPDATE_SESSION } from 'constants/sessionConstants';
import { updateSessionNetworkStatusAction } from '../sessionActions';

const mockStore = configureMockStore([ReduxAsyncQueue]);
const store = mockStore({});
describe('Session actions', () => {
  it('should update the network status', () => {
    const expectedActions = [
      { type: UPDATE_SESSION, payload: { isOnline: false } },
    ];

    store.dispatch(updateSessionNetworkStatusAction(false));
    expect(store.getActions()).toEqual(expectedActions);
  });
});
