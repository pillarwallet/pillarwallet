// @flow
import * as React from 'react';
import { Dimensions } from 'react-native';
import styled from 'styled-components';
import { getRandomInt } from 'utils/common';
import AnimatedBackroundItem from './AnimatedBackgroundItem';

type State = {
  animatedBackgroundItemList: []
}

const window = Dimensions.get('window');

const Wrapper = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  width: ${window.width};
  height: ${window.height};
`;

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
    let i = 0;

    const newAnimatedBackgroundItemList = [...this.state.animatedBackgroundItemList];
    const colors = [
      'rgb(255,0,5)',
      'rgb(0,191,255)',
      'rgb(248,231,28)',
      'rgb(145,145,255)',
      'rgb(80,227,194)',
    ];

    this.interval = setInterval(() => {
      const newPositionX = getRandomInt(0, window.width);
      const newPositionY = getRandomInt(0, window.height);
      const newSize = getRandomInt(10, 40);
      const newColor = colors[Math.floor(Math.random() * colors.length)];

      if (this.state.animatedBackgroundItemList.length >= 50) {
        newAnimatedBackgroundItemList.shift();
      }
      newAnimatedBackgroundItemList.push(
        {
          key: i,
          positionX: newPositionX,
          positionY: newPositionY,
          size: newSize,
          color: newColor,
        },
      );
      this.setState({
        animatedBackgroundItemList: newAnimatedBackgroundItemList,
      });
      i += 1;
    }, getRandomInt(50, 200));
  }

  render() {
    const { animatedBackgroundItemList } = this.state;
    return (

      <Wrapper>
        {animatedBackgroundItemList.map((animatedBackgroundItem) => {
          return (
            <AnimatedBackroundItem
              key={animatedBackgroundItem.key}
              size={animatedBackgroundItem.size}
              color={animatedBackgroundItem.color}
              positionX={animatedBackgroundItem.positionX}
              positionY={animatedBackgroundItem.positionY}
            />
          );
        })}
      </Wrapper>
    );
  }
}
