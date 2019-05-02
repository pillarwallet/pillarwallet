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
import { Animated, Easing } from 'react-native';
import { baseColors } from 'utils/variables';
import styled from 'styled-components/native';

type Props = {
  value: number, // 0 - 100
  tiny?: boolean,
  wrapperStyle?: Object,
}
type State = {
  tankValueAnimated: Animated.Value,
}

const TankWrapper = styled.View`
  height: ${props => props.tiny ? 20 : 170}px;
  width: ${props => props.tiny ? 6 : 30}px;
  background-color: white;
  border-width: ${props => props.tiny ? 1 : 3}px;
  border-color: ${props => props.tiny ? baseColors.electricBlueIntense : baseColors.white};
  border-radius: ${props => props.tiny ? 3 : 15}px;
  overflow: hidden;
`;

const TankLevel = styled.View`
  width: ${props => props.tiny ? 10 : 80}px;
  background-color: ${baseColors.caribbeanGreen};
  position: absolute;
  bottom: -2px;
  left: ${props => props.tiny ? -3 : -35}px;
`;


const TankEmptyEmptyDot = styled.View`
  width: 2px;
  height: 2px;
  background-color: ${baseColors.burningFire};
  border-radius: 2px;
  position: absolute;
  left: 1px;
  bottom: 1.5px;
`;

const TankLevelAnimated = Animated.createAnimatedComponent(TankLevel);

export default class Tank extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      tankValueAnimated: new Animated.Value(this.props.value),
    };
  }

  componentDidUpdate(prevProps: Props) {
    const {
      value,
    } = this.props;

    if (prevProps.value !== value) {
      this.animateValue(value);
    }
  }

  animateValue = (newValuePercentage: number) => {
    Animated.timing(
      this.state.tankValueAnimated,
      {
        toValue: newValuePercentage,
        easing: Easing.linear,
        duration: 800,
      },
    ).start();
  };

  render() {
    const { tankValueAnimated } = this.state;
    const { value: tankValue, tiny, wrapperStyle } = this.props;
    return (
      <TankWrapper tiny={tiny} style={wrapperStyle}>
        {(tankValue > 0 && <TankLevelAnimated
          tiny={tiny}
          style={{
            transform: [{ rotate: '-15deg' }],
            height: tankValueAnimated.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          }}
        />) || <TankEmptyEmptyDot />}
      </TankWrapper>
    );
  }
}

