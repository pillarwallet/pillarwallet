// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';
import KeyPad from 'components/KeyPad';

storiesOf('KeyPad', module)
  .add('Default', () => (
    <KeyPad onKeyPress={action('Button clicked')} />
  ))
  .add('Pincode', () => (
    <KeyPad type="pincode" onKeyPress={action('Button clicked')} />
  ));
