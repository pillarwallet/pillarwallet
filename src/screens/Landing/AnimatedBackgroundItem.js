// @flow
import * as React from 'react';
import { Dimensions, Animated } from 'react-native';

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
  windowWidth() {
    return Dimensions.get('window').width;
  }

  windowHeight() {
    return Dimensions.get('window').height;
  }


  randomValue(min: number, max: number) {
    return (Math.random() * (max - min)) + min;
  }

  state = {
    movement: new Animated.Value(0),
    opacity: new Animated.Value(0),
  }


  componentDidMount() {
    this.fallDown();
  }

  fallDown() {
    Animated.parallel([

      Animated.timing(
        this.state.movement,
        {
          toValue: -500,
          duration: 5000,
          delay: 0,
        },
      ),

      Animated.sequence([

        Animated.parallel([
          Animated.spring(
            this.state.opacity,
            {
              toValue: 1,
            },
          ),
        ]),

        Animated.spring(
          this.state.opacity,
          {
            toValue: 0,
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
