// @flow
import { UPDATE_BADGES } from 'constants/badgesConstants';
import { saveDbAction } from './dbActions';

export const fetchBadgesAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      wallet: { data: wallet },
      badges: { data: badges },
    } = getState();

    const userBadges = await api.fetchBadges({ address: wallet.address });
    console.log('userBadges', userBadges);
    if (userBadges && Object.keys(userBadges).length) {
      const ids = Object.keys(userBadges);
      const badgesInfo = await api.fetchBadgesInfo({ address: wallet.address, ids });

      const updatedBadges = ids.map(badgeId => {
        badgeId = Number(badgeId);
        const oldBadgeInfo = badges.find(({ id }) => Number(id) === badgeId) || {};
        const badgeInfo = badgesInfo[badgeId] || oldBadgeInfo;
        return {
          ...badgeInfo,
          id: badgeId,
          balance: userBadges[badgeId],
        };
      });

      console.log('badges', updatedBadges);
      dispatch(saveDbAction('badges', { badges: updatedBadges }, true));
      dispatch({ type: UPDATE_BADGES, payload: updatedBadges });
    }
  };
};
