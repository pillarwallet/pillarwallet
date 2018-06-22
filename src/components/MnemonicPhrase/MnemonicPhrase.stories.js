// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import MnemonicPhrase from 'components/MnemonicPhrase';

const phrase = 'fox the ipsum brown green dog jumps the red quick over lorem lazy';

storiesOf('MnemonicPhrase', module)
  .add('Default', () => (
    <MnemonicPhrase phrase={phrase} />
  ));
