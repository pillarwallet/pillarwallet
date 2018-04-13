import React from 'react';
import { Text } from 'react-native';

import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

import Button from './Button';
import CenterView from './CenterView';
import Padding from './Padding';
import Welcome from './Welcome';
import AssetCard from 'components/AssetCard';

storiesOf('Welcome', module).add('to Storybook', () => <Welcome showApp={linkTo('Button')} />);

storiesOf('Button', module)
  .addDecorator(getStory => <CenterView>{getStory()}</CenterView>)
  .add('with text', () => (
    <Button onPress={action('clicked-text')}>
      <Text>Hello Button</Text>
    </Button>
  ))
  .add('with some emoji', () => (
    <Button onPress={action('clicked-emoji')}>
      <Text>😀 😎 👍 💯</Text>
    </Button>
  ));
  storiesOf('Asset Card List', module)
    .addDecorator(getStory => <Padding>{getStory()}</Padding>)
    .add('Default', () => (
      <AssetCard name='Ethereum' amount='1234.56' color='#EFEFEF' />
    ))
    .add('Red', () => (
      <AssetCard name='EOS' amount='1234.56' color='#FF4444' />
    ))
    .add('Blue', () => (
      <AssetCard name='Golem' amount='1234.56' color='#123123' />
    ))
