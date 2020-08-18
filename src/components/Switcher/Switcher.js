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
import { Animated, TouchableOpacity } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import type { Theme } from 'models/Theme';
import { getThemeColors, themedColors } from 'utils/themes';
import { LIGHT_THEME } from 'constants/appSettingsConstants';

type Props = {
  isOn: boolean,
  onToggle: () => void,
  disabled?: boolean,
  theme: Theme,
  small?: boolean,
}

type State = {
  offsetX: Animated.Value
}

const TOGGLE_DIAMETER = 28;
const OFF_POSITION = 1.5;
const ON_POSITION = 20.5;

const TOGGLE_DIAMETER_SMALL = 14;
const OFF_POSITION_SMALL = 0.75;
const ON_POSITION_SMALL = 10.25;

const Toggle = styled.View`
  align-items: center;
  justify-content: center;
  position: absolute;
  background-color: ${themedColors.surface};
  elevation: 2;
  ${({ theme }) => theme.current === LIGHT_THEME && 'box-shadow: 0px 2px 2px rgba(0,0,0,0.05);'}
`;

const SwitcherWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  ${({ disabled }) => disabled && 'opacity: 0.4;'}
`;

const AnimatedToggle = Animated.createAnimatedComponent(Toggle);


class Switcher extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.toggleDiameter = props.small ? TOGGLE_DIAMETER_SMALL : TOGGLE_DIAMETER;
    this.onPosition = props.small ? ON_POSITION_SMALL : ON_POSITION;
    this.offPosition = props.small ? OFF_POSITION_SMALL : OFF_POSITION;
    this.state = {
      offsetX: new Animated.Value(props.isOn ? this.onPosition : this.offPosition),
    };
  }

  componentDidUpdate(prevProps) {
    const { isOn } = this.props;
    if (isOn !== prevProps.isOn) this.toggle();
  }

  toggle = () => {
    const { isOn } = this.props;
    const { offsetX } = this.state;
    const toValue = isOn
      ? this.onPosition
      : this.offPosition;

    Animated.timing(
      offsetX,
      {
        toValue,
        duration: 300,
      },
    ).start();
  };

  render() {
    const {
      isOn,
      onToggle,
      disabled,
      theme,
      small,
    } = this.props;
    const { offsetX } = this.state;
    const colors = getThemeColors(theme);
    return (
      <SwitcherWrapper disabled={disabled}>
        <TouchableOpacity
          style={{
            justifyContent: 'center',
            width: small ? 25 : 50,
            borderRadius: (this.toggleDiameter / 2) + 3,
            height: this.toggleDiameter + 3,
            backgroundColor: isOn ? colors.accent : colors.border,
          }}
          activeOpacity={0.8}
          onPress={onToggle}
          disabled={disabled}
        >
          <AnimatedToggle
            isOn={isOn}
            style={{
              transform: [{ translateX: offsetX }],
              width: this.toggleDiameter,
              height: this.toggleDiameter,
              borderRadius: this.toggleDiameter,
            }}
          />
        </TouchableOpacity>
      </SwitcherWrapper>
    );
  }
}

export default withTheme(Switcher);
