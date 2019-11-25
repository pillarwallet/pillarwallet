// @flow
import * as React from 'react';
import { Wrapper } from 'components/Layout';
import Loader from 'components/Loader';

const LogoutPending = () => (
  <Wrapper fullscreen center>
    <Loader messages={['Deleting takes a moment', 'Sorry to see you go']} firstMessageWithoutDelay />
  </Wrapper>
);

export default LogoutPending;
