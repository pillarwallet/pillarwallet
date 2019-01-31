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
