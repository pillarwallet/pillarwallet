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
}

type State = {
  offsetX: Animated.Value
}

const TOGGLE_DIAMETER = 28;
const OFF_POSITION = 1.5;
const ON_POSITION = 20.5;

const Toggle = styled.View`
  align-items: center;
  justify-content: center;
  position: absolute;
  background-color: ${themedColors.surface};
  elevation: 2;
  ${({ theme }) => theme.current === LIGHT_THEME && 'box-shadow: 0px 2px 2px rgba(0,0,0,0.05);'}
  width: ${TOGGLE_DIAMETER}px;
  height: ${TOGGLE_DIAMETER}px;
  border-radius: ${TOGGLE_DIAMETER}px;
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
    this.state = {
      offsetX: new Animated.Value(props.isOn ? ON_POSITION : OFF_POSITION),
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
      ? ON_POSITION
      : OFF_POSITION;

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
    } = this.props;
    const { offsetX } = this.state;
    const colors = getThemeColors(theme);
    return (
      <SwitcherWrapper disabled={disabled}>
        <TouchableOpacity
          style={{
            justifyContent: 'center',
            width: 50,
            borderRadius: (TOGGLE_DIAMETER / 2) + 3,
            height: TOGGLE_DIAMETER + 3,
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
            }}
          />
        </TouchableOpacity>
      </SwitcherWrapper>
    );
  }
}

export default withTheme(Switcher);
