// @flow
import { generateAccessKey } from 'utils/invitations';
import type { ApiUser } from 'models/Contacts';
import { ADD_INVITATION, TYPE_SENT } from 'constants/invitationsConstants';
import { Toast } from 'native-base';
import Storage from 'services/storage';

const storage = Storage.getInstance('db');

export const sendInvitationAction = (user: ApiUser) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { user: { data: { walletId } }, invitations: { data: invitations } } = getState();

    const index = invitations.findIndex(el => el.id === user.id);
    if (index >= 0) {
      Toast.show({
        text: 'Invitation has already been sent',
        buttonText: '',
      });
      return;
    }

    const accessKey = generateAccessKey();
    await api.sendInvitation(user.id, accessKey, walletId);
    const invitation = { ...user, invitationType: TYPE_SENT };

    await storage.save('invitations', { invitations: [...invitations, invitation] });

    dispatch({
      type: ADD_INVITATION,
      payload: invitation,
    });

    Toast.show({
      text: 'Invitation sent!',
      buttonText: '',
    });
  };
};
