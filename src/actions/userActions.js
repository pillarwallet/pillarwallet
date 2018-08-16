// @flow
import { UPDATE_USER, REGISTERED } from 'constants/userConstants';
import Storage from 'services/storage';

const storage = Storage.getInstance('db');

export const updateUserAction = (walletId: string, field: Object) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const user = await api.updateUser({ walletId, ...field });
    if (!Object.keys(user).length) return;

    const updatedUser = { ...user, lastUpdateTime: +new Date() };
    await storage.save('user', { user: updatedUser }, true);

    dispatch({
      type: UPDATE_USER,
      payload: { user: updatedUser, state: REGISTERED },
    });
  };
};

export const updateUserAvatarAction = (walletId: string, formData: any) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { user: { data: user } } = getState();

    const userAvatar = await api.updateUserAvatar(walletId, formData).catch(() => ({}));
    if (!Object.keys(userAvatar).length || !userAvatar.profileImage) return;

    const updatedUser = {
      ...user,
      profileImage: userAvatar.profileImage,
      lastUpdateTime: +new Date(),
    };
    await storage.save('user', { user: updatedUser }, true);

    dispatch({
      type: UPDATE_USER,
      payload: { user: updatedUser, state: REGISTERED },
    });
  };
};

