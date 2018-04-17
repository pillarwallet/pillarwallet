// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';
import Button from 'components/Button';

storiesOf('Button', module)
  .add('Primary', () => (
    <Button onPress={action('Press Button')} title="Send Ether" />
  ))
  .add('Secondary', () => (
    <Button onPress={action('Press Button')} secondary title="Reset Password" />
  ))
  .add('Disabled', () => (
    <Button onPress={action('Press Button')} disabled title="Withdraw" />
  ))
  .add('Small', () => (
    <Button onPress={action('Press Button')} small title="More Options" />
  ));
