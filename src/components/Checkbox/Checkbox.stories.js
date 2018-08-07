// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';
import Checkbox from 'components/Checkbox';


storiesOf('Checkbox', module)
  .add('Default', () => (
    <Checkbox
      checked
      onPress={() => action('Toggle Default Checkbox')}
      toggleCheckbox={action('Toggle Default Checkbox')}
      tag="Checkbox"
      text="Lorem"
    />
  ));
