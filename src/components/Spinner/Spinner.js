// @flow
import React from 'react';
import styled from 'styled-components/native';
import LottieView from 'lottie-react-native';

const AnimationWrapper = styled.View``;

const animationSource = require('./animation.json');

export default class Spinner extends React.Component<*> {
  animation: LottieView

  componentDidMount() {
    this.animation.play();
  }
  render() {
    return (
      <AnimationWrapper>
        <LottieView
          ref={(animation) => {
            this.animation = animation;
          }}
          source={animationSource}
          style={{ width: 40, height: 40 }}
          loop
        />
      </AnimationWrapper>
    );
  }
}
