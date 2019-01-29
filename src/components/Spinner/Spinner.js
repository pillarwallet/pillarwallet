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
