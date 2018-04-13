// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import DefaultButton from 'components/Buttons/DefaultButton';

storiesOf('DefaultButton', module)
  .add('Default', () => (
    <DefaultButton title="Continue" />
  ));
