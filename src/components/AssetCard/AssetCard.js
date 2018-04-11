// @flow
import * as React from 'react';
import { Text, View } from 'react-native';
import styles from './styles';

type Props = {
  title: string
}

export default class AssetCard extends React.Component<Props> {
  componentDidMount() {
    // empty
  }

  render() {
    return (
      <View>
        <Text>{this.props.title}</Text>
      </View>
    );
  }
}
