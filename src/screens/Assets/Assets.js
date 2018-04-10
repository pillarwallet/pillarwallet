// @flow
import * as React from 'react';
import { View } from 'react-native';
import AssetCardList from 'app/components/AssetCardList';
import styles from './styles';

export default class Assets extends React.Component<{}> {
  componentDidMount() {
    // empty
  }

  render() {
    return (
      <View style={styles.assets}>
        <AssetCardList />
      </View>
    );
  }
}
