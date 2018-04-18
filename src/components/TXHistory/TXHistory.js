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
    backgroundColor: '#f7f7f7',
    height: '100%',
  },
});

export default class TXHistory extends React.Component<Props, State> {
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

