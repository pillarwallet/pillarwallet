// @flow
import React from 'react';
import { Animated } from 'react-native';

type Props = {

}

type State = {
  progress: Animated.Value,
}

const animationSource = require('./animation.json');

export default class Spinner extends React.Component<Props, State> {
  render() {

  }
}
