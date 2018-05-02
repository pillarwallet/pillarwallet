// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';
import Button from 'components/Button';

storiesOf('Button', module)
  .add('Primary', () => (
    <Button onPress={action('Press Primary Button')} title="Send Ether" />
  ))
  .add('Secondary', () => (
    <Button onPress={action('Press Secondary Button')} secondary title="Reset Password" />
  ))
  .add('Disabled', () => (
    <Button onPress={action('Press Disabled Button')} disabled title="Withdraw" />
  ))
