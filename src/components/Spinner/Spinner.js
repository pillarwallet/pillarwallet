// @flow
import React from 'react';
import styled from 'styled-components/native';
import { DangerZone } from 'expo';

const { Lottie } = DangerZone;

const AnimationWrapper = styled.View``;

const animationSource = require('./animation.json');

export default class Spinner extends React.Component<*> {
  animation: Lottie

  componentDidMount() {
    this.animation.play();
  }
  render() {
    return (
      <AnimationWrapper>
        <Lottie
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
