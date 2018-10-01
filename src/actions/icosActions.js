// @flow
import { SET_ICOS, SET_ICO_FUNDING_INSTRUCTIONS } from 'constants/icosConstants';

export const fetchICOsAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { user: { data: { id: userId } } } = getState();
    const icos = await api.fetchICOs(userId);
    dispatch({
      type: SET_ICOS,
      payload: icos,
    });
  };
};

export const fetchICOFundingInstructionsAction = (currency: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { user: { data: { walletId } } } = getState();
    const instructions = await api.fetchICOFundingInstructions(walletId, currency);
    dispatch({
      type: SET_ICO_FUNDING_INSTRUCTIONS,
      payload: instructions,
    });
  };
};
