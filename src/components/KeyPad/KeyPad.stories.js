// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';
import KeyPad from 'components/KeyPad';

const createKeyPadButton = (value: string, label: string, callback: () => void) => {
  return {
    label,
    value,
    callback,
  };
};

const keyPadButtons = [
  createKeyPadButton('1', '1', action('Clicked: 1')),
  createKeyPadButton('2', '2', action('Clicked: 2')),
  createKeyPadButton('3', '3', action('Clicked: 3')),
];

storiesOf('KeyPad', module)
  .add('Default', () => (
    <KeyPad buttons={keyPadButtons} />
  ));
