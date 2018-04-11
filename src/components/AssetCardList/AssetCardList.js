// @flow
import * as React from 'react';
import { FlatList } from 'react-native';
import AssetCard from 'components/AssetCard';

type Props = {
  assetCardListItems: ["name", "amount"]
}

export default class AssetCardList extends React.Component<Props> {
  componentDidMount() {
    // empty
  }

  render() {
    return (
      <FlatList
        data={this.props.assetCardListItems}
        renderItem={({ item }) => <AssetCard name={item.key} amount={item.amount} color={item.color} />}
      />
    );
  }
}
