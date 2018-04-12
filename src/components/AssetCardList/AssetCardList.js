// @flow
import * as React from 'react';
import { FlatList } from 'react-native';
import AssetCard from 'components/AssetCard';

type Asset = {
  key: string,
  name: string,
  amount: number,
  color: string
}

type Props = {
  assetData: Asset[]
}

export default class AssetCardList extends React.Component<Props> {
  componentDidMount() {
    // empty
  }

  render() {
    return (
      <FlatList
        data={this.props.assetData}
        renderItem={({ item }: {item: Asset}) => (
          <AssetCard name={item.name} amount={item.amount} color={item.color} />
        )}
      />
    );
  }
}
