// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';
import Checkbox from 'components/Checkbox';
import CheckboxItem from 'components/CheckboxItem';
import CheckboxText from 'components/CheckboxText';


storiesOf('Checkbox', module)
  .add('Default', () => (
    <CheckboxItem>
      <Checkbox checked toggleCheckbox={action('Toggle Default Checkbox')} tag="Checkbox" />
      <CheckboxText>Lorem</CheckboxText>
    </CheckboxItem>
  ));
