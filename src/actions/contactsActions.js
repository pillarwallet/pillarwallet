// @flow
import partition from 'lodash.partition';
import {
  UPDATE_SEARCH_RESULTS,
  FETCHING,
  UPDATE_CONTACTS_STATE,
  UPDATE_CONTACTS,
  DISCONNECT_CONTACT,
} from 'constants/contactsConstants';
import Toast from 'components/Toast';
import { excludeLocalContacts } from 'utils/contacts';
import { saveDbAction } from './dbActions';
import { deleteContactAction } from './chatActions';

export const searchContactsAction = (query: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { user: { data: { walletId } }, contacts: { data: localContacts } } = getState();

    dispatch({
      type: UPDATE_CONTACTS_STATE,
      payload: FETCHING,
    });

    let apiUsers = await api.userSearch(query, walletId);
    apiUsers = excludeLocalContacts(apiUsers, localContacts);

    const myContacts = localContacts.filter(contact => {
      return contact.username.toUpperCase().indexOf(query.toUpperCase()) > -1;
    });

    dispatch({
      type: UPDATE_SEARCH_RESULTS,
      payload: {
        apiUsers,
        localContacts: myContacts,
      },
    });
  };
};

export const resetSearchContactsStateAction = () => {
  return async (dispatch: Function) => {
    dispatch({
      type: UPDATE_CONTACTS_STATE,
      payload: null,
    });
  };
};

export const syncContactAction = (userId: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId } },
      contacts: { data: contacts },
      accessTokens: { data: accessTokens },
    } = getState();

    const accessToken = accessTokens.find(token => token.userId === userId);
    if (!accessToken) return;

    const userInfo = await api.userInfoById(userId, {
      walletId,
      userAccessKey: accessToken.myAccessToken,
      targetUserAccessKey: accessToken.userAccessToken,
    });

    if (!userInfo || !Object.keys(userInfo).length) {
      return;
    }

    const oldInfo = contacts.find(({ id }) => id === userId) || {};
    const currentDate = +new Date() / 1000;
    const updatedContacts = contacts
      .filter(({ id }) => id !== userId)
      .concat({ ...userInfo, createdAt: oldInfo.createdAt || currentDate });
    dispatch(saveDbAction('contacts', { contacts: updatedContacts }, true));

    dispatch({
      type: UPDATE_CONTACTS,
      payload: updatedContacts,
    });
  };
};

export const disconnectContactAction = (contactId: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    try {
      const {
        user: { data: { walletId, accessToken } },
        contacts: { data: localContacts },
        accessTokens: { data: accessTokens },
      } = getState();

      const { myAccessToken = null } = accessTokens[0] || {};

      if (!myAccessToken) {
        Toast.show({
          message: 'If you imported the wallet currently we can\'t delete contact',
          type: 'warning',
          title: 'Cannot delete contact',
          autoClose: false,
        });
        return;
      }

      const [contactToDisconnect, updatedContacts] = partition(localContacts, (contact) =>
        contact.id === contactId);

      await api.connection.disconnect(contactId, accessToken, walletId);
      await deleteContactAction(contactToDisconnect[0].username);

      dispatch({
        type: DISCONNECT_CONTACT,
        payload: contactToDisconnect[0] || {},
      });

      dispatch(saveDbAction('contacts', { contacts: updatedContacts }, true));

      dispatch({
        type: UPDATE_CONTACTS,
        payload: updatedContacts,
      });
    } catch (e) {
      Toast.show({
        message: 'Please try again',
        type: 'warning',
        title: 'Cannot delete contact',
        autoClose: false,
      });
    }
  };
};
