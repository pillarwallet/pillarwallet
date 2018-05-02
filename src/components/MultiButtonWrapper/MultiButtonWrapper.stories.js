// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';
import MultiButtonWrapper from 'components/MultiButtonWrapper';
import Button from 'components/Button';

storiesOf('MultiButtonWrapper', module)
  .add('Default', () => (
    <MultiButtonWrapper>
      <Button marginBottom="20px" onPress={action('Press Button')} title="Sign in" />
      <Button secondary marginBottom="20px" onPress={action('Press Button')} title="Register" />
      <Button secondary marginBottom="20px" onPress={action('Press Button')} title="Recover Account" />
    </MultiButtonWrapper>
  ));
