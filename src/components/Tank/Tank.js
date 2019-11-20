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
  value: number,
  totalValue: number,
  tiny?: boolean,
  wrapperStyle?: Object,
}
type State = {
  tankValueAnimated: Animated.Value,
}

const TankWrapper = styled.View`
  height: ${props => props.tiny ? 20 : 216}px;
  width: ${props => props.tiny ? 6 : 22}px;
  background-color: ${props => props.tiny ? baseColors.card : '#3e5d87'};
  border-width: ${props => props.tiny ? 1 : 0}px;
  border-color: ${props => props.tiny ? baseColors.primary : baseColors.border};
  border-radius: ${props => props.tiny ? 3 : 4}px;
  overflow: hidden;
`;

const TankInner = styled.View`
  ${props => props.tiny ? `border: 1px solid ${baseColors.border}; border-radius: 10px` : ''};
  height: ${props => props.tiny ? 18 : 216}px;
  width: ${props => props.tiny ? 4 : 22}px;
  overflow: hidden;
  justify-content: flex-end;
  align-items: center;
`;

const TankLevel = styled.View`
  width: ${props => props.tiny ? 10 : 22}px;
  background-color: ${props => props.tiny ? baseColors.primary : baseColors.accent};
  position: absolute;
  bottom: ${props => props.tiny ? 0 : 0}px;
  left: ${props => props.tiny ? -3 : 0}px;
`;

const TankEmptyEmptyDot = styled.View`
  width: 2px;
  height: 2px;
  background-color: ${baseColors.negative};
  border-radius: 2px;
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
    const {
      value: tankValue,
      totalValue,
      tiny,
      wrapperStyle,
    } = this.props;
    const additionalStyle = tiny ? { transform: [{ rotate: '-15deg' }] } : {};
    return (
      <TankWrapper tiny={tiny} style={wrapperStyle}>
        <TankInner tiny={tiny}>
          {(tankValue <= 0 && !!tiny && <TankEmptyEmptyDot />)
          || <TankLevelAnimated
            tiny={tiny}
            style={
              [{
                height: tankValueAnimated.interpolate({
                  inputRange: [0, totalValue],
                  outputRange: ['0%', '100%'],
                }),
              },
                additionalStyle,
              ]}
          />}
        </TankInner>
      </TankWrapper>
    );
  }
}

