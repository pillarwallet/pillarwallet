// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import Input from 'components/Input';


storiesOf('Input', module)
  .add('Default', () => (
    <Input />
  ))
  .add('Multiline', () => (
    <Input multiline height={80} />
  ));
