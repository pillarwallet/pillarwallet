// @flow
import * as React from 'react';
import { Text, View } from 'react-native';
import styles from './styles';

export default class AssetCardList extends React.Component<{}> {
  componentDidMount() {
    // empty
  }

  render() {
    return (
      <View>
        <Text>{this.props.text}</Text>
      </View>
    );
  }
}
