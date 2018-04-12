// @flow
import * as React from 'react';
import Container from 'components/Container';
import AssetCardList from 'components/AssetCardList';

const assets = [
  {
    key: 'Ethereum', name: 'Ethereum', amount: 1250.1094, color: '#B4D455',
  },
  {
    key: 'Pillar', name: 'Pillar', amount: 1337.1337, color: '#4444FF',
  },
];

const Assets = () => {
  return (
    <Container>
      <AssetCardList assets={assets} />
    </Container>
  );
};
export default Assets;
