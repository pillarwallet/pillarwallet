// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import OutlineButton from 'components/Buttons/OutlineButton';

storiesOf('OutlineButton', module)
  .add('Default', () => (
    <OutlineButton title="Continue" />
  ));
