// @flow
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import ReduxAsyncQueue from 'redux-async-queue';
import Storage from 'services/storage';
import { delay } from 'utils/common';
import { saveDbAction } from '../dbActions';

jest.setTimeout(20000);

const storage = Storage.getInstance('db');

const mockStore = configureMockStore([thunk, ReduxAsyncQueue]);
describe('DB actions', () => {
  let store;
  let count = 0;
  beforeAll((done) => {
    store = mockStore({});
    const timer = setInterval(() => {
      if (count === 30) {
        clearInterval(timer);
        done();
        return;
      }

      count++;
      // UNCOMMENT only for test purposes to see test failing
      // storage.save('app_settings', { appSettings: { userId: count } }, true);
      store.dispatch(saveDbAction('app_settings', { appSettings: { userId: count } }, true));
    }, 10);
  });

  it('DB should not have any conflicts and the userId should be equal to the latest count value', async () => {
    await delay(5000);
    const conflicts = await storage.getConflicts();
    const { appSettings: { userId } } = await storage.get('app_settings');
    expect(conflicts).toHaveLength(0);
    expect(userId).toEqual(count);
  });
});
