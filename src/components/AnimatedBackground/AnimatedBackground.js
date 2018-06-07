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
  animatedBackgroundItemList: Item[],
  shouldAnimate: boolean,
  timer: number
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
  constructor(props) {
    super(props);
    this.generateAnimatedBackgroundItemList = this.generateAnimatedBackgroundItemList.bind(this);
    this.state = {
      animatedBackgroundItemList: [],
      shouldAnimate: true,
      timer: null,
    };
  }

  componentDidMount() {
    const timer = setInterval(this.generateAnimatedBackgroundItemList, 500);
    this.setState({ timer });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.shouldAnimate !== this.props.shouldAnimate) {
      if (this.props.shouldAnimate) {
        const newTimer = setInterval(this.generateAnimatedBackgroundItemList.bind(this), 500);
        this.setState({ timer: newTimer });
      } else {
        clearInterval(this.state.timer);
      }
    }
  }

  componentWillUnmount() {
    clearInterval(this.state.timer);
  }

  generateAnimatedBackgroundItemList() {
    let animatedBackgroundItemList = this.state.animatedBackgroundItemList;
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
