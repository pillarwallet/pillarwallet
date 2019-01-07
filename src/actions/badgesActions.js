// @flow
import { saveDbAction } from './dbActions';
import type { Assets } from '../models/Asset';
import { FETCHING, UPDATE_ASSETS_STATE, UPDATE_BALANCES } from '../constants/assetsConstants';
import { transformAssetsToObject } from '../utils/assets';
import { getExchangeRates } from '../services/assets';
import { UPDATE_RATES } from '../constants/ratesConstants';

export const fetchBadgesAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { wallet: { data: wallet } } = getState();
    /* dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHING,
    }); */

    const badges = await api.fetchBadges({ address: wallet.address });
    console.log('badges', badges);
    if (badges && Object.keys(badges).length) {
      // find new badges

      // const transformedBalances = transformAssetsToObject(balances);
      // dispatch(saveDbAction('balances', { balances: transformedBalances }, true));
      // dispatch({ type: UPDATE_BADGES, payload: badges });
    }
  };
};
