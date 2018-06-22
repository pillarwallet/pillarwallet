// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import FakeInput from 'components/FakeInput';


storiesOf('FakeInput', module)
  .add('Default', () => (
    <FakeInput />
  ))
  .add('With value', () => (
    <FakeInput>value</FakeInput>
  ));
