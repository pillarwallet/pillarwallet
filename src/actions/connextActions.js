// @flow
// services
import {connectChannel} from 'services/connext';
import {
  CONNEXT_INIT_CHANNEL_PENDING,
  CONNEXT_INIT_CHANNEL_SUCCESS,
  CONNEXT_INIT_CHANNEL_FAILURE,
} from 'constants/connextConstants';
import {
  ConnextInitChannelPending,
  ConnextInitChannelSuccess,
  ConnextInitChannelFailure,
} from 'reducers/connextReducer';

const connextInitChannelPending = (): ConnextInitChannelPending => ({
  type: CONNEXT_INIT_CHANNEL_PENDING,
});

const connextInitChannelSuccess = (
  channel: Channel,
): ConnextInitChannelSuccess => ({
  type: CONNEXT_INIT_CHANNEL_SUCCESS,
  channel,
});

const connextInitChannelFailure = (
  error: Error,
): ConnextInitChannelFailure => ({
  type: CONNEXT_INIT_CHANNEL_FAILURE,
  error: {
    code: 10000,
    message: error.message,
  },
});

export const initChannel = async (privateKey: string) => {
  return async (dispatch: Dispatch) => {
    dispatch(connextInitChannelPending());
    try {
      const channel = await connectChannel(privateKey);
      dispatch(connextInitChannelSuccess(channel));
    } catch (e) {
      dispatch(connextInitChannelFailure(e));
    }
  };
};
