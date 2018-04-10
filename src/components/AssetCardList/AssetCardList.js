// @flow
import * as React from 'react';
import { FlatList } from 'react-native';
import AssetCard from 'app/components/AssetCard';
import styles from './styles';

export default class AssetCardList extends React.Component<{}> {
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
