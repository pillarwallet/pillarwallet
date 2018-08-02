// @flow
import React from 'react';
import { DangerZone } from 'expo';

const { Lottie } = DangerZone;
const tokenSentConfirmationAnimation = require('./transactionSentConfirmationAnimation.json');

export default class TransactionSentAnimation extends React.Component<*> {
  animation: Lottie;

  componentDidMount() {
    this.animation.play();
  }
  render() {
    return (
      <Lottie
        ref={(animation) => {
          this.animation = animation;
        }}
        source={tokenSentConfirmationAnimation}
        style={{
          width: 200,
          height: 200,
          marginBottom: -40,
          marginTop: -10,
        }}
        speed={0.5}
        loop={false}
      />
    );
  }
}
