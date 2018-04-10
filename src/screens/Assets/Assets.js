// @flow
import * as React from 'react';
import { View } from 'react-native';
import AssetCardList from 'components/AssetCardList';
import styles from './styles';

const assetCardListItems = [{ key: 'Ethereum' }, { key: 'Pillar' }];

export default class Assets extends React.Component<{}> {
  componentDidMount() {
    // empty
  }

  render() {
    return (
      <View style={styles.assets}>
        <AssetCardList assetCardListItems={assetCardListItems} />
      </View>
    );
  }
}
