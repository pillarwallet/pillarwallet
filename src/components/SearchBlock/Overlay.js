// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import styled from 'styled-components/native';
import { Animated, Dimensions, PanResponder } from 'react-native';

type Props = {
  active: boolean,
  topOffset?: number,
  fadeOutAnimationCallback?: () => void,
  handleClick?: () => void,
};

const { height: screenHeight } = Dimensions.get('window');

const FullScreenOverlayWrapper = styled.View`
  z-index: 100;
  top: ${({ topOffset }) => topOffset}px;
  left: 0;
  bottom: 0;
  right: 0;
  width: 100%;
  height: ${screenHeight}px;
  position: absolute;
`;

const FullScreenOverlay = styled.View`
  width: 100%;
  height: ${screenHeight}px;
  background-color: rgba(0,0,0,.6);
`;

const AnimatedFullScreenOverlay = Animated.createAnimatedComponent(FullScreenOverlay);


class Overlay extends React.Component<Props> {
  _panResponder: Object;
  fullScreenOverlayOpacity: Animated.Value;

  constructor(props: Props) {
    super(props);
    this.fullScreenOverlayOpacity = new Animated.Value(0);

    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: props.handleClick,
      onPanResponderMove: props.handleClick,
      onPanResponderTerminationRequest: () => false,
    });
  }

  componentDidUpdate(prevProps: Props) {
    const { active, fadeOutAnimationCallback } = this.props;
    if (prevProps.active !== active) {
      if (active) {
        this.animateFullScreenOverlayOpacity(false);
      } else {
        this.animateFullScreenOverlayOpacity(true, fadeOutAnimationCallback);
      }
    }
  }

  animateFullScreenOverlayOpacity = (active: boolean, onEnd?: Function) => {
    const { fullScreenOverlayOpacity } = this;
    if (!active) {
      fullScreenOverlayOpacity.setValue(0);
      Animated.timing(fullScreenOverlayOpacity, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }).start();
    } else {
      fullScreenOverlayOpacity.setValue(1);
      Animated.timing(fullScreenOverlayOpacity, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
      }).start(() => onEnd && onEnd());
    }
  };

  render() {
    const { topOffset = 0, active } = this.props;
    if (!active) return null;
    return (
      <FullScreenOverlayWrapper {...this._panResponder.panHandlers} topOffset={topOffset}>
        <AnimatedFullScreenOverlay
          style={{
          opacity: this.fullScreenOverlayOpacity,
        }}
        />
      </FullScreenOverlayWrapper>
    );
  }
}

export default Overlay;
