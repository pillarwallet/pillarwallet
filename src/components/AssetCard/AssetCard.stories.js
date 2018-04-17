// @flow
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import AssetCard from 'components/AssetCard';

storiesOf('Asset Card', module)
  .add('Ethereum', () => (
    <AssetCard name="Ethereum" amount={1234.56} color="#EFEFEF" />
  ))
  .add('Pillar', () => (
    <AssetCard name="Pillar" amount={1234.56} color="rgb(0, 191, 255);" />
  ))
  .add('2030', () => (
    <AssetCard name="2030" amount={1234.56} color="rgb(130, 188, 64);" />
  ))
  .add('GBP', () => (
    <AssetCard name="GBP" amount={1234.56} color="#85bb65" />
  ));
