// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';
import PinCode from 'components/PinCode';

storiesOf('PinCode', module)
  .add('Default', () => (
    <PinCode onPinEntered={action('Pin Entered')} />
  ));
