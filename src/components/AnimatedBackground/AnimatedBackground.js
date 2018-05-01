// @flow
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
  animatedBackgroundItemList: Item[]
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

export default class AnimatedBackground extends React.Component<{}, State> {
  interval: IntervalID;

  state = {
    animatedBackgroundItemList: [],
  };

  componentDidMount() {
    this.generateAnimatedBackgroundItemList();
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  generateAnimatedBackgroundItemList() {
    let { animatedBackgroundItemList } = this.state;
    this.interval = setInterval(() => {
      const newPositionX = getRandomInt(0, window.width);
      const newPositionY = getRandomInt(0, window.height);
      const newSize = getRandomInt(10, 40);
      const newColor = colors[getRandomInt(0, colors.length - 1)];
      if (animatedBackgroundItemList.length >= 50) {
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
    }, 200);
  }

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
