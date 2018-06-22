// @flow
import React from 'react';
import { View } from 'react-native';
import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';
import Button from 'components/Button';
import HelpText from 'components/HelpText';

storiesOf('HelpText', module)
  .add('Default', () => (
    <View>
      <HelpText>Send 1234.5678 ETH to Alice  </HelpText>
      <Button onPress={action('Press Default Button')} title="Confirm" />
    </View>
  ));
