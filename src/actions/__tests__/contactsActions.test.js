// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import {
  UPDATE_SEARCH_RESULTS,
  FETCHING,
  UPDATE_CONTACTS_STATE,
  UPDATE_CONTACTS,
} from 'constants/contactsConstants';
import Toast from 'components/Toast';
import * as chatActions from '../chatActions';
import * as dbActions from '../dbActions';
import * as actions from '../contactsActions';

describe('Contacts Actions', () => {
  const dispatchMock = jest.fn();

  const mockLocalContacts = [
    {
      id: 'user-foo-bar',
      username: 'foobar',
      profileImage: 'foobar-image',
      ethAddress: 'eth-address-foobar',
    },
    {
      id: 'user-lorem-ipsum',
      username: 'loremipsum',
      profileImage: 'loremipsum-image',
      ethAddress: 'eth-address-loremipsum',
    },
  ];

  const accessTokens = {
    data: [
      {
        userId: 'user-foo-bar',
        myAccessToken: 'my-personal-access-token',
        userAccessKey: 'user-foo-bar-access-token',
      },
      {
        userId: 'user-lorem-ipsum',
        myAccessToken: 'my-personal-access-token-2',
        userAccessKey: 'user-foo-bar-access-token-2',
      },
    ],
  };

  const getStateMock = () => {
    return {
      user: {
        data: {
          walletId: 'some-wallet-current-user',
        },
      },
      invitations: { data: [] },
      contacts: { data: mockLocalContacts },
      accessTokens,
    };
  };

  const getStateMockNoAccessToken = () => {
    return {
      user: {
        data: {
          id: 'current-user-id',
          username: 'current-user',
          walletId: 'some-wallet-current-user',
        },
      },
      invitations: { data: [] },
      contacts: { data: mockLocalContacts },
      accessTokens: { data: [] },
    };
  };

  const apiMock = {
    userSearch: async () => [mockLocalContacts[1]],
    userInfoById: async () => mockLocalContacts[0],
    pillarWalletSdk: {
      connection: {
        disconnect: async () => ({
          result: 'success',
          message: 'Connection is successfully disconnected',
        }),
      },
    },
    disconnect: async () => mockLocalContacts[0],
    disconnectUser: async () => ({
      result: 'success',
      message: 'Connection is successfully disconnected',
    }),
  };

  afterEach(() => {
    dispatchMock.mockClear();
  });

  describe('Search', () => {
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
  });

  describe('Sync', () => {
    const RealDate = Date;

    beforeEach(() => {
      global.Date = class extends RealDate {
        constructor() {
          return new RealDate('2017-11-25T12:34:56z');
        }
      };
      jest.spyOn(dbActions, 'saveDbAction').mockImplementation(() => Promise.resolve());
    });

    afterEach(() => {
      global.Date = RealDate;
    });

    it('should sync contacts', async () => {
      await actions.syncContactAction(mockLocalContacts[0].id)(dispatchMock, getStateMock, apiMock);

      const createdAt = +new Date();
      const updatedContactsMock = mockLocalContacts;
      const updateContactFirst = Object.assign({}, updatedContactsMock[0], { createdAt, lastUpdateTime: createdAt });
      const updateContactSecond = Object.assign({}, updatedContactsMock[1]);

      expect(dispatchMock).toBeCalledWith({
        type: UPDATE_CONTACTS,
        payload: [updateContactSecond, updateContactFirst],
      });
    });

    it('should return and do nothing if accessToken does not exist', async () => {
      const stateWithNoAccessToken = () => {
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
        dispatchMock, stateWithNoAccessToken, apiMock);
      expect(action).toBe(undefined);
    });
  });

  describe('Manage', () => {
    describe('calling deleteContactAction', () => {
      beforeEach(() => {
        jest.spyOn(dbActions, 'saveDbAction').mockImplementation(() => Promise.resolve());
      });

      it('should disconnect contact', async () => {
        jest.spyOn(chatActions, 'deleteContactAction').mockImplementation(() => Promise.resolve());
        await actions.disconnectContactAction('user-lorem-ipsum')(dispatchMock, getStateMock, apiMock);

        expect(chatActions.deleteContactAction).toBeCalledWith('loremipsum');

        expect(dispatchMock).toBeCalledWith({
          type: UPDATE_CONTACTS,
          payload: [mockLocalContacts[0]],
        });
      });

      it('should not disconnect contact if contact is not deleted in signal', async () => {
        jest.spyOn(chatActions, 'deleteContactAction').mockImplementation(() => Promise.reject());
        await actions.disconnectContactAction('user-lorem-ipsum')(dispatchMock, getStateMock, apiMock);

        expect(dispatchMock).not.toBeCalledWith({
          type: UPDATE_CONTACTS,
          payload: mockLocalContacts[0],
        });
      });
    });

    it('should not allow to disconnect if accessToken is not present (reimport wallet)', async () => {
      jest.spyOn(Toast, 'show');
      await actions.disconnectContactAction('user-lorem-ipsum')(dispatchMock, getStateMockNoAccessToken, apiMock);

      expect(Toast.show).toBeCalledWith({
        message: 'It\'s currently impossible to delete contact on imported wallet',
        type: 'warning',
        title: 'Cannot delete contact',
        autoClose: false,
      });

      Toast.show.mockRestore();
    });
  });
});
