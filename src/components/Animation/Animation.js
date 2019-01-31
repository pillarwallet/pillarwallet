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
      marginBottom: 10,
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
