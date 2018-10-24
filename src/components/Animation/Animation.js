// @flow
import React from 'react';
import Lottie from 'lottie-react-native';

const placeholder = require('assets/animations/transactionSentConfirmationAnimation.json');

type Props = {
  source: Object,
  style?: Object,
  speed: number,
  loop: boolean,
}

export default class Animation extends React.Component<Props, {}> {
  static defaultProps = {
    source: placeholder,
    style: {
      width: 140,
      height: 140,
      marginBottom: -10,
      marginTop: -10,
    },
    speed: 3,
    loop: false,
  }

  animation: Lottie;

  componentDidMount() {
    this.animation.play();
  }

  render() {
    const {
      style,
      source,
      speed,
      loop,
    } = this.props;
    return (
      <Lottie
        ref={(node) => {
          this.animation = node;
        }}
        source={source}
        style={style}
        speed={speed}
        loop={loop}
      />
    );
  }
}
