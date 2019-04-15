// @flow

import React from 'react';
import { Hobbes } from 'HobbesUI';
import { DECRYPTING, INVALID_PASSWORD } from 'constants/walletConstants';

import Scene from './scene.js';

/* eslint no-console: 0 */
Hobbes.add({
  parent: 'SCREEN',
  group: 'Pin Code Unlock',
  id: 'PIN_CODE_UNLOCK_DEFAULT',
  title: 'Default',
  component: (
    <Scene
      onPinEntered={(pin) => console.log(pin)}
      onForgotPin={() => console.log('forgot pin')}
    />
  ),
});

Hobbes.add({
  parent: 'SCREEN',
  group: 'Pin Code Unlock',
  id: 'PIN_CODE_UNLOCK_INVALID_PASSWORD',
  title: 'Invalid Password',
  component: (
    <Scene
      onPinEntered={(pin) => console.log(pin)}
      onForgotPin={() => console.log('forgot pin')}
      walletState={INVALID_PASSWORD}
    />
  ),
});

Hobbes.add({
  parent: 'SCREEN',
  group: 'Pin Code Unlock',
  id: 'PIN_CODE_UNLOCK_DECRYPTING',
  title: 'Decrypting wallet',
  component: (
    <Scene
      onPinEntered={(pin) => console.log(pin)}
      onForgotPin={() => console.log('forgot pin')}
      walletState={DECRYPTING}
    />
  ),
});
