// @flow
import partition from 'lodash.partition';
import {
  UPDATE_SEARCH_RESULTS,
  FETCHING,
  UPDATE_CONTACTS_STATE,
  UPDATE_CONTACTS,
} from 'constants/contactsConstants';
import { UPDATE_ACCESS_TOKENS } from 'constants/accessTokensConstants';
import { UPDATE_INVITATIONS } from 'constants/invitationsConstants';
import Toast from 'components/Toast';
import { excludeLocalContacts } from 'utils/contacts';
import { saveDbAction } from './dbActions';
import { deleteChatAction, deleteContactAction } from './chatActions';

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
    const currentDate = +new Date();
    const updatedContacts = contacts
      .filter(({ id }) => id !== userId)
      .concat({ ...userInfo, createdAt: oldInfo.createdAt || currentDate, lastUpdateTime: currentDate });
    dispatch(saveDbAction('contacts', { contacts: updatedContacts }, true));

    dispatch({
      type: UPDATE_CONTACTS,
      payload: updatedContacts,
    });
  };
};

export const disconnectContactAction = (contactId: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId } },
      invitations: { data: invitations },
      contacts: { data: contacts },
      accessTokens: { data: accessTokens },
    } = getState();

    try {
      if (accessTokens.length < 1 || !accessTokens[0].myAccessToken) {
        throw new Error('It\'s currently impossible to delete contact on imported wallet');
      }

      const userRelatedAccessTokens = accessTokens.find(token => token.userId === contactId);

      if (!userRelatedAccessTokens) {
        throw new Error('Contact doesn\'t exist on this wallet');
      }

      const { myAccessToken, userAccessToken } = userRelatedAccessTokens;

      await api.disconnectUser(
        contactId,
        myAccessToken,
        userAccessToken,
        walletId,
      );

      const [contactToDisconnect, updatedContacts] = partition(contacts, (contact) =>
        contact.id === contactId);

      await dispatch(deleteChatAction(contactToDisconnect[0].username));
      await dispatch(deleteContactAction(contactToDisconnect[0].username));

      await dispatch(saveDbAction('contacts', { contacts: updatedContacts }, true));

      const updatedAccessTokens = accessTokens
        .filter(({ userId }) => userId !== contactId);

      await dispatch(saveDbAction('accessTokens', { accessTokens: updatedAccessTokens }, true));

      const updatedInvitations = invitations.filter(({ id }) => id !== contactId);

      await dispatch(saveDbAction('invitations', { invitations: updatedInvitations }, true));

      dispatch({
        type: UPDATE_CONTACTS,
        payload: updatedContacts,
      });

      dispatch({
        type: UPDATE_ACCESS_TOKENS,
        payload: updatedAccessTokens,
      });
      dispatch({
        type: UPDATE_INVITATIONS,
        payload: updatedInvitations,
      });

      Toast.show({
        message: 'Successfully Disconnected',
        type: 'info',
      });
    } catch (e) {
      const message = e.message === 'Request failed with status code 404' ?
        'Please try again' : e.message;

      Toast.show({
        message,
        type: 'warning',
        title: 'Cannot delete contact',
        autoClose: false,
      });
    }
  };
};
