// @flow
import * as React from 'react';
import Container from 'components/Container';
import AssetCardList from 'components/AssetCardList';

const assetCardListItems = [{ key: 'Ethereum', amount: 1250.1094, color: '#B4D455' }, { key: 'Pillar', amount: 1337.1337, color: '#4444FF' }];

export default class Assets extends React.Component<{}> {
  componentDidMount() {
    // empty
  }

  render() {
    return (
      <Container>
        <AssetCardList assetCardListItems={assetCardListItems} />
      </Container>
    );
  }
}
