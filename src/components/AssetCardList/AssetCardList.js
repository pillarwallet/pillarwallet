// @flow
import * as React from 'react';
import { FlatList } from 'react-native';
import AssetCard from 'components/AssetCard';

type Props = {
  assetCardListItems: ["name"]
}

export default class AssetCardList extends React.Component<Props> {
  componentDidMount() {
    // empty
  }

  render() {
    return (
      <FlatList
        data={this.props.assetCardListItems}
        renderItem={({ item }) => <AssetCard title={item.key} />}
      />
    );
  }
}
