// @flow
import * as React from 'react';
import { FlatList } from 'react-native';
import type { Asset } from 'models/Asset';
import AssetCard from 'components/AssetCard';

type Props = {
  assets: Array<Asset>
}

export default class AssetCardList extends React.Component<Props> {
  componentDidMount() {
    // empty
  }

  render() {
    return (
      <FlatList
        data={this.props.assets}
        renderItem={({ item }: {item: Asset}) => (
          <AssetCard name={item.name} amount={item.amount} color={item.color} />
        )}
      />
    );
  }
}
