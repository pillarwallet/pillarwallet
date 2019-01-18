// @flow
import { UPDATE_COLLECTIBLES } from 'constants/collectiblesConstants';
import { saveDbAction } from './dbActions';

export const fetchCollectiblesAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { wallet: { data: wallet } } = getState();

    const collectibles = await api.fetchCollectibles(wallet.address);
    console.log('collectibles', collectibles);
    if (collectibles && collectibles.assets && collectibles.categories) {
      dispatch(saveDbAction('collectiblesAssets', { collectiblesAssets: collectibles.assets }, true));
      dispatch(saveDbAction('collectiblesCategories', { collectiblesCategories: collectibles.categories }, true));
      dispatch({ type: UPDATE_COLLECTIBLES, payload: collectibles });
    }
  };
};
