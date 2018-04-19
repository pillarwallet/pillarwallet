// @flow
import * as React from 'react';
import Container from 'components/Container';
import Wrapper from 'components/Wrapper';
import Title from 'components/Title';
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
      <Wrapper padding>
        <Title>Assets</Title>
        <AssetCardList assets={assets} />
      </Wrapper>
    </Container>
  );
};
export default Assets;
