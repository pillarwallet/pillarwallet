// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';
import OutlineButton from 'components/Buttons/OutlineButton';

storiesOf('OutlineButton', module)
  .add('Default', () => (
    <OutlineButton title="Continue" onPress={action('Press Outline Button')} />
  ));
