// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import AssetCardList from 'components/AssetCardList';

const assets = [
  {
    key: 'Ethereum', name: 'Ethereum', amount: 1250.1094, color: '#B4D455',
  },
  {
    key: 'Pillar', name: 'Pillar', amount: 1337.1337, color: '#4444FF',
  },
];


storiesOf('Asset Card List', module)
  .add('Default', () => (
    <AssetCardList assets={assets} />
  ));
