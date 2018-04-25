// @flow
import * as React from 'react';
import { View, Dimensions } from 'react-native';
import { getRandomInt } from 'utils/common';
import AnimatedBackroundItem from './AnimatedBackgroundItem';

type State = {
  animatedBackgroundItemList: []
}

export default class AnimatedBackground extends React.Component<{}, State> {
  state = {
    animatedBackgroundItemList: [],
  }

  componentDidMount() {
    this.generateAnimatedBackgroundItemList();
  }

  windowHeight() {
    return Dimensions.get('window').height;
  }

  windowWidth() {
    return Dimensions.get('window').width;
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

    setInterval(() => {
      const newPositionX = getRandomInt(0, this.windowWidth());
      const newPositionY = getRandomInt(0, this.windowHeight());
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

      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: this.windowWidth(),
          height: this.windowHeight(),
        }}
      >
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
      </View>
    );
  }
}
