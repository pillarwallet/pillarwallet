// @flow
import React from 'react';
import { StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import Lottie from 'lottie-react-native';

type Props = {
  width?: number,
  height?: number,
  style?: StyleSheet.Styles,
};

const AnimationWrapper = styled.View``;

const animationSource = require('./animation.json');

export default class Spinner extends React.Component<Props> {
  static defaultProps = {
    width: 40,
    height: 40,
    style: {},
  };
  animation: Lottie;

  componentDidMount() {
    this.animation.play();
  }
  render() {
    const { width, height, style } = this.props;
    return (
      <AnimationWrapper style={style}>
        <Lottie
          ref={(animation) => {
            this.animation = animation;
          }}
          source={animationSource}
          style={{ width, height }}
          loop
        />
      </AnimationWrapper>
    );
  }
}
