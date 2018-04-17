// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';
import DefaultButton from 'components/Buttons/DefaultButton';

storiesOf('DefaultButton', module)
  .add('Default', () => (
    <DefaultButton title="Continue" onPress={action('Press Default Button')} />
  ));
