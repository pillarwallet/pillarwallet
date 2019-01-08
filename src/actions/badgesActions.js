// @flow
import { UPDATE_BADGES } from 'constants/badgesConstants';
import { saveDbAction } from './dbActions';

export const fetchBadgesAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { wallet: { data: wallet } } = getState();

    const userBadges = await api.fetchBadges({ address: wallet.address });
    console.log('userBadges', userBadges);
    if (userBadges && Object.keys(userBadges).length) {
      const ids = Object.keys(userBadges);
      const badgesInfo = await api.fetchBadgesInfo({ address: wallet.address, ids });
      const badges = ids.map(badgeId => ({
        id: badgeId,
        balance: userBadges[badgeId],
        ...(badgesInfo[badgeId] || {}),
      }));
      console.log('badges', badges);
      dispatch(saveDbAction('badges', { badges }, true));
      dispatch({ type: UPDATE_BADGES, payload: badges });
    }
  };
};
