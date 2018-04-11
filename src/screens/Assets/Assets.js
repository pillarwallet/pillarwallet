// @flow
import * as React from 'react';
import Container from 'components/Container';
import AssetCardList from 'components/AssetCardList';

const assetCardListItems = [{ key: 'Ethereum' }, { key: 'Pillar' }];

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
