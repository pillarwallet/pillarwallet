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
import { Animated } from 'react-native';
import styled, { css } from 'styled-components/native';
import { getColorByTheme } from 'utils/themes';
import { LIGHT_THEME } from 'constants/appSettingsConstants';

type Props = {
  isOn?: boolean,
  onToggle: ?(boolean) => mixed,
  disabled?: boolean,
  testID?: string,
  accessibilityLabel?: string,
};

type State = {
  offsetX: Animated.Value,
};

const TOGGLE_DIAMETER = 28;
const OFF_POSITION = 1.5;
const ON_POSITION = 20.5;

const Toggle = styled.View`
  align-items: center;
  justify-content: center;
  position: absolute;
  background-color: ${({ isOn }) => isOn
    ? css`${getColorByTheme({ lightKey: 'basic070', darkKey: 'basic000' })}`
    : css`${getColorByTheme({ lightKey: 'basic070', darkKey: 'basic000' })}`};
  elevation: ${({ disabled }) => disabled ? 0 : 2};
  ${({ theme }) => theme.current === LIGHT_THEME && 'box-shadow: 0px 2px 2px rgba(0,0,0,0.05);'}
  width: ${TOGGLE_DIAMETER}px;
  height: ${TOGGLE_DIAMETER}px;
  border-radius: ${TOGGLE_DIAMETER}px;
`;

const SwitcherTouchable = styled.TouchableOpacity`
  justify-content: center;
  width: 50px;
  border-radius: ${(TOGGLE_DIAMETER / 2) + 3}px;
  height: ${TOGGLE_DIAMETER + 3}px;
  background-color: ${({ isOn }) => isOn
    ? css`${getColorByTheme({ lightKey: 'basic020', darkKey: 'primaryAccent280' })}`
    : css`${getColorByTheme({ lightKey: 'basic080', darkKey: 'basic030' })}`};};
  ${({ disabled }) => disabled && 'opacity: 0.4;'}
`;

const AnimatedToggle = Animated.createAnimatedComponent(Toggle);

class Switcher extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      offsetX: new Animated.Value(props.isOn ? ON_POSITION : OFF_POSITION),
    };
  }

  componentDidUpdate(prevProps: Props) {
    const { isOn } = this.props;
    if (isOn !== prevProps.isOn) this.toggle();
  }

  toggle = () => {
    const { isOn } = this.props;
    const { offsetX } = this.state;
    const toValue = isOn ? ON_POSITION : OFF_POSITION;

    Animated.timing(offsetX, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  render() {
    const { isOn, onToggle, disabled, testID, accessibilityLabel } = this.props;
    const { offsetX } = this.state;

    return (
      <SwitcherTouchable
        activeOpacity={1}
        onPress={() => onToggle?.(!isOn)}
        disabled={disabled}
        isOn={isOn}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
      >
        <AnimatedToggle
          isOn={isOn}
          style={{
            transform: [{ translateX: offsetX }],
          }}
          disabled={disabled}
        />
      </SwitcherTouchable>
    );
  }
}

export default Switcher;
