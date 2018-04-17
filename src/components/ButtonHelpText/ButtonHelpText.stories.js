// @flow
import React from 'react';
import { View } from 'react-native';
import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';
import Button from 'components/Button';
import ButtonHelpText from 'components/ButtonHelpText';

storiesOf('ButtonHelpText', module)
  .add('Default', () => (
    <View>
      <ButtonHelpText>Send 1234.5678 ETH to Alice  </ButtonHelpText>
      <Button onPress={action('Press Default Button')} title="Confirm" />
    </View>
  ));
