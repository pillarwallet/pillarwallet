// @flow
import * as React from 'react';
import { View, Dimensions } from 'react-native';
import AnimatedBackroundItem from './AnimatedBackgroundItem';

type State = {
  animatedBackgroundItemList: []
}

export default class AnimatedBackground extends React.Component<{}, State> {
  state = {
    animatedBackgroundItemList: [],
  }

  randomValue(min: number, max: number) {
    return (Math.random() * (max - min)) + min;
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
      const newPositionX = this.randomValue(0, this.windowWidth());
      const newPositionY = this.randomValue(0, this.windowHeight());
      const newSize = this.randomValue(10, 40);
      const newColor = colors[Math.floor(Math.random() * colors.length)];

      if (this.state.animatedBackgroundItemList.length < 50) {
        newAnimatedBackgroundItemList.push(
          {
            key: i,
            positionX: newPositionX,
            positionY: newPositionY,
            size: newSize,
            color: newColor,
          },
        );
      } else {
        newAnimatedBackgroundItemList.shift();
        newAnimatedBackgroundItemList.push(
          {
            key: i,
            positionX: newPositionX,
            positionY: newPositionY,
            size: newSize,
            color: newColor,
          },
        );
      }
      this.setState({
        animatedBackgroundItemList: newAnimatedBackgroundItemList,
      });
      i += 1;
    }, this.randomValue(100, 100));
  }

  componentDidMount() {
    this.generateAnimatedBackgroundItemList();
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
