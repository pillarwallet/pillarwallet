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
import { Dimensions } from 'react-native';
import styled from 'styled-components/native';
import { getRandomInt } from 'utils/common';
import AnimatedBackroundItem from './AnimatedBackgroundItem';

type Item = {
  positionX: number,
  positionY: number,
  size: number,
  color: string,
}

type State = {
  animatedBackgroundItemList: Item[],
}

type Props = {
  shouldAnimate: boolean,
}

const window = Dimensions.get('window');

const Wrapper = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  width: ${window.width};
  height: ${window.height};
`;

const colors = [
  'rgb(255,0,5)',
  'rgb(0,191,255)',
  'rgb(248,231,28)',
  'rgb(145,145,255)',
  'rgb(80,227,194)',
];

export default class AnimatedBackground extends React.Component<Props, State> {
  timer: IntervalID;

  constructor(props: Props) {
    super(props);
    this.timer = setInterval(this.generateAnimatedBackgroundItemList, 500);
    this.state = {
      animatedBackgroundItemList: [],
    };
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.shouldAnimate === prevProps.shouldAnimate) return;
    if (this.props.shouldAnimate) {
      this.timer = setInterval(this.generateAnimatedBackgroundItemList, 500);
    } else {
      clearInterval(this.timer);
    }
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  generateAnimatedBackgroundItemList = () => {
    let animatedBackgroundItemList = [...this.state.animatedBackgroundItemList];
    const newPositionX = getRandomInt(0, window.width);
    const newPositionY = getRandomInt(0, window.height - 50);
    const newSize = getRandomInt(15, 40);
    const newColor = colors[getRandomInt(0, colors.length - 1)];
    if (animatedBackgroundItemList.length >= 25) {
      animatedBackgroundItemList = animatedBackgroundItemList.slice(1);
    }
    animatedBackgroundItemList = animatedBackgroundItemList.concat({
      positionX: newPositionX,
      positionY: newPositionY,
      size: newSize,
      color: newColor,
    });
    this.setState({
      animatedBackgroundItemList,
    });
  };

  render() {
    const { animatedBackgroundItemList } = this.state;

    return (
      <Wrapper>
        {animatedBackgroundItemList.map(({
          size,
          color,
          positionX,
          positionY,
        }: Item) => (
          <AnimatedBackroundItem
            key={`${positionY}_${positionX}_${color}_${size}`}
            size={size}
            color={color}
            positionX={positionX}
            positionY={positionY}
          />
        ))}
      </Wrapper>
    );
  }
}
