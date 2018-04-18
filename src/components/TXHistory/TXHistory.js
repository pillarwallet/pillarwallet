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
  animFadeIn: any,
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f7f7f7',
    height: '100%',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 200 },
  },
  header: {
    fontWeight: 'bold',
    fontSize: 20,
  }
});

export default class TXHistory extends React.Component<Props, State> {
  state = {
    animFadeIn: new Animated.Value(0),
  };

componentDidMount = () => {
  Animated.timing(
    this.state.animFadeIn,
    {
      toValue: 1,
      duration: 500,
    },
  ).start();
}

render() {
  const { animFadeIn } = this.state;
  return (
    <Animated.View style={[styles.container, { opacity: animFadeIn }]}>
      <Text style={styles.header} >activity</Text>
    </Animated.View>
  );
}
}

