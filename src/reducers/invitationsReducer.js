// @flow
import { ADD_INVITATION, UPDATE_INVITATIONS, UPDATE_INVITATIONS_STATE } from 'constants/invitationsConstants';

export type InvitationsReducerState = {
  data: Object[],
  invitationState: ?string,
}

export type InvitationsReducerAction = {
  type: string,
  payload: any,
}

const initialState = {
  data: [],
  invitationState: null,
};

export default function invitationsReducer(
  state: InvitationsReducerState = initialState,
  action: InvitationsReducerAction,
) {
  switch (action.type) {
    case UPDATE_INVITATIONS_STATE:
      return { ...state, invitationState: action.payload };
    case UPDATE_INVITATIONS:
      return { ...state, data: action.payload };
    case ADD_INVITATION:
      return { ...state, data: [...state.data, action.payload] };
    default:
      return state;
  }
}
