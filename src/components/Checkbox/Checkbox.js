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
import { Animated, TouchableHighlight } from 'react-native';
import { BaseText } from 'components/Typography';
import styled, { withTheme } from 'styled-components/native';
import { baseColors, fontSizes, spacing, fontStyles } from 'utils/variables';
import Icon from 'components/Icon';
import { LIGHT_THEME } from 'constants/appSettingsConstants';
import type { Theme } from 'models/Theme';
import { getThemeColors } from 'utils/themes';

const CheckboxBox = styled.View`
  width: 24;
  height: 24;
  margin-right: ${spacing.mediumLarge}px;
  border-radius: ${props => props.rounded ? 12 : 2}px;
  flex: 0 0 24px;
  border-width: 1px;
  border-color: ${({ theme, active }) => active ? theme.colors.primary : theme.colors.border}
  justify-content: center;
  align-items: center;
  ${({ rounded, theme }) => rounded ? `background-color: ${theme.colors.card}` : ''};
  ${({ rounded, active, theme }) => rounded && active && theme.current === LIGHT_THEME
    ? `
      shadow-color: ${baseColors.black};
      shadow-radius: 3px;
      shadow-opacity: 0.15;
      shadow-offset: 0px 2px;
      elevation: 4;`
    : ''}
`;

const CheckboxText = styled(BaseText)`
  ${props => props.small ? fontStyles.regular : fontStyles.medium};
  color: ${({ light, theme }) => light ? theme.colors.accent : theme.colors.text};
  flex-wrap: wrap;
`;

const TextWrapper = styled.View`
  flex: 1;
  margin-top: 2px;
  flex-direction: row;
`;

const CheckboxWrapper = styled.View`
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
  opacity: ${props => props.disabled ? 0.5 : 1};
`;

type Props = {
  text?: string,
  onPress: Function,
  disabled?: boolean,
  checked?: boolean,
  children?: React.Node,
  wrapperStyle?: Object,
  rounded?: boolean,
  lightText?: boolean,
  small?: boolean,
  theme: Theme,
};

type State = {
  checked: boolean,
  animateActive: Animated.Value,
};

class Checkbox extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      checked: !!props.checked,
      animateActive: new Animated.Value(props.checked ? 12 : 4),
    };
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.disabled !== this.props.disabled && this.props.disabled) {
      this.toggleCheckBox(false);
    }
    if (prevProps.checked !== this.props.checked) {
      this.toggleCheckBoxWithoutCallback(this.props.checked);
    }
  }

  animateCheckBox = (checked: boolean) => {
    const { animateActive } = this.state;
    if (!checked) {
      Animated.spring(animateActive, {
        toValue: 1,
        duration: 600,
      }).start();
    } else {
      Animated.spring(animateActive, {
        toValue: 12,
        duration: 600,
      }).start();
    }
  };

  toggleOnPress = (checkedStatus: boolean) => {
    if (!this.props.disabled) {
      this.props.onPress(checkedStatus);
    }
  };

  toggleCheckBox = (status?: boolean, callCallback?: boolean = true) => {
    const { checked } = this.state;
    const { disabled } = this.props;

    let checkedStatus;
    if (disabled) {
      checkedStatus = false;
    } else if (status !== undefined) {
      checkedStatus = status;
    } else {
      checkedStatus = !checked;
    }

    this.setState({ checked: checkedStatus }, () => {
      if (callCallback) this.toggleOnPress(checkedStatus);
    });
    this.animateCheckBox(checkedStatus);
  };

  toggleCheckBoxWithoutCallback = (status?: boolean) => {
    this.toggleCheckBox(status, false);
  };

  render() {
    const { checked } = this.state;
    const {
      disabled,
      text,
      children,
      rounded,
      wrapperStyle,
      small,
      lightText,
      theme,
    } = this.props;

    const colors = getThemeColors(theme);

    return (
      <TouchableHighlight
        onPress={() => this.toggleCheckBox()}
        underlayColor="transparent"
        style={wrapperStyle}
      >
        <CheckboxWrapper disabled={disabled}>
          <CheckboxBox active={disabled ? false : checked} rounded={rounded}>
            {!!checked &&
            <Icon
              name="check"
              style={{
                color: colors.primary,
                fontSize: fontSizes.tiny,
              }}
            />
            }
          </CheckboxBox>
          {!!text && <CheckboxText small={small} light={lightText}>{text}</CheckboxText>}
          {!!children &&
          <TextWrapper>
            <CheckboxText small={small} light={lightText}>{children}</CheckboxText>
          </TextWrapper>}
        </CheckboxWrapper>
      </TouchableHighlight>
    );
  }
}

export default withTheme(Checkbox);
