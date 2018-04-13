import React from 'react';
import { Text } from 'react-native';

import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

import Padding from './Padding';
import Welcome from './Welcome';
import AssetCard from 'components/AssetCard';

storiesOf('Welcome', module).add('to Storybook', () => <Welcome showApp={linkTo('Button')} />);

storiesOf('Asset Card', module)
  .addDecorator(getStory => <Padding>{getStory()}</Padding>)
  .add('Ethereum', () => (
    <AssetCard name='Ethereum' amount='1234.56 ETH' color='#EFEFEF' />
  ))
  .add('Pillar', () => (
    <AssetCard name='Pillar' amount='1234.56 PLR' color='rgb(0, 191, 255);' />
  ))
  .add('2030', () => (
    <AssetCard name='2030' amount='1234.56 TWTH' color='rgb(130, 188, 64);' />
  ))
  .add('GBP', () => (
    <AssetCard name='GBP' amount='£1234.56' color='#85bb65' />
  ))
