// @flow
import {
  UPDATE_SEARCH_RESULTS,
  FETCHING,
  UPDATE_CONTACTS_STATE,
  UPDATE_CONTACTS,
} from 'constants/contactsConstants';
import * as actions from '../contactsActions';

describe('Contacts Actions', () => {
  const dispatchMock = jest.fn();

  const mockLocalContacts = [
    {
      id: 'user-foo-bar',
      username: 'foobar',
      connectionKey: 'some-connection-key-foobar',
      profileImage: 'foobar-image',
      ethAddress: 'eth-address-foobar',
    },
    {
      id: 'user-lorem-ipsum',
      username: 'loremipsum',
      connectionKey: 'some-connection-key-loremipsum',
      profileImage: 'loremipsum-image',
      ethAddress: 'eth-address-loremipsum',
    },
  ];

  const getStateMock = () => {
    return {
      user: { data: { walletId: 'some-wallet-id' } },
      contacts: { data: mockLocalContacts },
      accessTokens: {
        data: [
          {
            userId: 'user-foo-bar',
            myAccessToken: 'my-personal-access-token',
            userAccessKey: 'user-foo-bar-access-token',
          },
        ],
      },
    };
  };

  const apiMock = {
    userSearch: async () => [mockLocalContacts[1]],
    userInfoById: async () => mockLocalContacts[0],
  };

  const RealDate = Date;

  beforeEach(() => {
    global.Date = class extends RealDate {
      constructor() {
        return new RealDate('2017-11-25T12:34:56z');
      }
    };
  });

  afterEach(() => {
    dispatchMock.mockClear();
    global.Date = RealDate;
  });

  it('should search contacts', async () => {
    await actions.searchContactsAction('')(dispatchMock, getStateMock, apiMock);

    expect(dispatchMock).toBeCalledWith({
      type: UPDATE_CONTACTS_STATE,
      payload: FETCHING,
    });

    expect(dispatchMock).toBeCalledWith({
      type: UPDATE_SEARCH_RESULTS,
      payload: {
        apiUsers: [],
        localContacts: mockLocalContacts,
      },
    });
  });

  it('should reset search contacts', async () => {
    await actions.resetSearchContactsStateAction()(dispatchMock);

    expect(dispatchMock).toBeCalledWith({
      type: UPDATE_CONTACTS_STATE,
      payload: null,
    });
  });

  it('should sync contacts', async () => {
    await actions.syncContactAction(mockLocalContacts[0].id)(dispatchMock, getStateMock, apiMock);

    const createdAt = +new Date() / 1000;
    const updatedContactsMock = mockLocalContacts;
    const updateContactFirst = Object.assign({}, updatedContactsMock[0], { createdAt });
    const updateContactSecond = Object.assign({}, updatedContactsMock[1]);

    expect(dispatchMock).toBeCalledWith({
      type: UPDATE_CONTACTS,
      payload: [updateContactSecond, updateContactFirst],
    });
  });

  it('should return and do nothing if accessToken does not exist', async () => {
    const getStateMockNoAccessToken = () => {
      return {
        user: { data: { walletId: 'some-wallet-id' } },
        contacts: { data: mockLocalContacts },
        accessTokens: {
          data: [
            {
              userId: 'user-inexistent',
              myAccessToken: 'my-personal-access-token',
              userAccessKey: 'user-foo-bar-access-token',
            },
          ],
        },
      };
    };

    const action = await actions.syncContactAction(mockLocalContacts[0].id)(
      dispatchMock, getStateMockNoAccessToken, apiMock);
    expect(action).toBe(undefined);
  });
});
