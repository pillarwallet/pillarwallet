// @flow
import { UPDATE_USER, REGISTERED } from 'constants/userConstants';
import Storage from 'services/storage';

const storage = Storage.getInstance('db');

export const updateUserAction = (walletId: string, field: Object) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const user = await api.updateUser({ walletId, ...field });
    if (!Object.keys(user).length) return;
    await storage.save('user', { user }, true);
    dispatch({
      type: UPDATE_USER,
      payload: { user, state: REGISTERED },
    });
  };
};

export const updateUserAvatarAction = (walletId: string, formData: any) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { user: { data: user } } = getState();
    const userAvatar = await api.updateUserAvatar(walletId, formData); // eslint-disable-line
    // Below to be investigated
    // const profileImage = await api.getUserAvatar({
    //   userId: user.id,
    //   walletId,
    // });
    // console.log(profileImage);
    if (!Object.keys(user).length) return;
    await storage.save('user', { user }, true);
    dispatch({
      type: UPDATE_USER,
      payload: { user, state: REGISTERED },
    });
  };
};

