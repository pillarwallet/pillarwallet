// @flow
import { UPDATE_BADGES } from 'constants/badgesConstants';
import { saveDbAction } from './dbActions';

export const fetchBadgesAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { wallet: { data: wallet } } = getState();

    const badges = await api.fetchBadges({ address: wallet.address });
    console.log('badges', badges);
    if (badges && Object.keys(badges).length) {
      // find new badges

      dispatch(saveDbAction('badges', { badges }, true));
      dispatch({ type: UPDATE_BADGES, payload: badges });
    }
  };
};
