// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import MneumonicPhrase from 'components/MneumonicPhrase';

const phrase = 'fox the ipsum brown green dog jumps the red quick over lorem lazy';

storiesOf('MneumonicPhrase', module)
  .add('Default', () => (
    <MneumonicPhrase phrase={phrase} />
  ));
