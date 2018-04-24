// @flow
import * as React from 'react';
import { Dimensions, Animated } from 'react-native';

type State = {
  positionY: number,
  positionX: number,
  opacity: number
}

type Props = {
}

export default class AnimatedBackroundItem extends React.Component<Props, State> {
  windowWidth() {
    return Dimensions.get('window').width;
  }

  windowHeight() {
    return Dimensions.get('window').height;
  }


  randomValue(max: number) {
    return Math.random() * max;
  }

  state = {
    positionY: new Animated.Value(this.randomValue(this.windowHeight())),
    positionX: new Animated.Value(this.randomValue(this.windowWidth())),
    opacity: 0,
  }


  componentDidMount() {
    this.fallDown();
  }

  fallDown() {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(
            this.state.opacity,
            {
              toValue: 1,
              duration: 10000,
              delay: 0,
            },
          ),
          Animated.timing(
            this.state.positionY,
            {
              toValue: this.windowHeight(),
              duration: 10000,
              delay: 0,
            },
          ),
          Animated.timing(
            this.state.positionX,
            {
              toValue: this.randomValue(this.windowWidth()),
              duration: 10000,
              delay: 0,
            },
          ),
        ]),
      ]),

    ).start();
  }

  render() {
    const { positionY, opacity } = this.state;

    return (
      <Animated.View style={{
        position: 'absolute',
        bottom: positionY,
        left: this.randomValue(this.windowWidth()),
        width: 40,
        height: 40,
        backgroundColor: '#FF0000',
        opacity,
      }}
      />
    );
  }
}
