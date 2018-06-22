// @flow
import * as React from 'react';
import { getRandomInt } from 'utils/common';
import { Animated } from 'react-native';

type State = {
  movement: number,
  opacity: number
}

type Props = {
  positionX: number,
  positionY: number,
  size: number,
  color: string
}

export default class AnimatedBackroundItem extends React.Component<Props, State> {
  state = {
    movement: new Animated.Value(0),
    opacity: new Animated.Value(0),
  };

  componentDidMount() {
    this.moveUp();
  }

  moveUp() {
    Animated.parallel([

      Animated.timing(
        this.state.movement,
        {
          toValue: getRandomInt(-40, -80),
          duration: 2400,
          useNativeDriver: true,
        },
      ),

      Animated.sequence([
        Animated.timing(
          this.state.opacity,
          {
            toValue: 1,
            useNativeDriver: true,
            duration: 1200,
          },
        ),
        Animated.timing(
          this.state.opacity,
          {
            toValue: 0,
            useNativeDriver: true,
            duration: 1200,
          },
        ),
      ]),
    ]).start();
  }

  render() {
    const { movement, opacity } = this.state;
    const {
      positionX, positionY, size, color,
    } = this.props;
    return (
      <Animated.View style={{
        position: 'absolute',
        bottom: positionY,
        left: positionX,
        width: size,
        height: size,
        backgroundColor: color,
        opacity,
        transform: [{
          translateY: movement,
        }],
      }}
      />
    );
  }
}
