// @flow
import * as React from 'react';
import {
  Animated,
  Button,
  StyleSheet,
  Text,
  Image,
  View,
} from 'react-native';

type Props = {
  // txHistory: any[]
}

type State = {
  animFadeIn: any,

}


const imageSend = require('assets/images/btn_iconSend.png');
const imageReceive = require('assets/images/btn_iconReceive.png');

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    height: 220,
    padding: 20,
    alignItems: 'stretch',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    alignSelf: 'center',
    flex: 1,
  },

});

export default class Content extends React.Component<Props, State> {
  state = {
    animFadeIn: new Animated.Value(0),
  }
componentDidMount = () => {
  Animated.timing(
    this.state.animFadeIn,
    {
      toValue: 1,
      duration: 250,
    },
  ).start();
}

render() {
  const { animFadeIn } = this.state;
  return (
    <Animated.View style={[styles.container, { opacity: animFadeIn }]}>
      <Text>This is some important information about this specific token.
            Obviously this is filler text, but soon it will be hooked up to the asset backend.
      </Text>
      <Animated.View style={styles.actionsContainer}>
        <View style={{ flexDirection: 'column', alignItems: 'center' }} >
          <Image
            style={{ width: 50, height: 50 }}
            source={imageSend}
          />
          <Button title="Send" />
        </View>
        <View style={{ flexDirection: 'column', alignItems: 'center' }} >
          <Image
            style={{ width: 50, height: 50 }}
            source={imageReceive}
          />
          <Button title="Receive" />
        </View>
      </Animated.View>
    </Animated.View>
  );
}
}
