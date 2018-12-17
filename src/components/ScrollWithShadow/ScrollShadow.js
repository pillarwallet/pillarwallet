// @flow
import * as React from 'react';
import { Animated } from 'react-native';
import styled from 'styled-components/native';
import LinearGradient from 'react-native-linear-gradient';
import { transparentize } from 'polished';

type Props = {
  topPosition?: number,
  shadowOpacity: Animated.Value,
};

const gradientShadow = ['rgba(0, 0, 0, 0.07)', transparentize(1, 'rgba(0, 0, 0, 0.07)')];

export const Center = styled.View`
  align-items: center;
`;

const ShadowHolder = styled(LinearGradient)`
  position: absolute;
  top: ${props => props.topPosition ? props.topPosition : 0}px;
  right: 0;
  width: 100%;
  z-index: 2;
`;

const ShadowHolderAnimated = Animated.createAnimatedComponent(ShadowHolder);

export const ScrollShadow = (props: Props) => {
  const { shadowOpacity, topPosition = 0 } = props;

  return (
    <ShadowHolderAnimated
      topPosition={topPosition}
      colors={gradientShadow}
      style={{
        height: 6,
        opacity: shadowOpacity,
      }}
    />
  );
};
