// @flow
import * as React from 'react';
import {
  Animated,
  StyleSheet,
  Text,
} from 'react-native';

type Props = {
  // txHistory: any[]
}

type State = {

}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    height: '100%',
    padding: 20,
  },
});

export default class AssetCardContent extends React.Component<Props, State> {
componentDidMount = () => {
}

render() {
  return (
    <Animated.View style={styles.container}>
      <Text>Some History</Text>
    </Animated.View>
  );
}
}

