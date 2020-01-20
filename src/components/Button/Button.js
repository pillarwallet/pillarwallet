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
import { TouchableOpacity } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import { Button as NBButton } from 'native-base';
import debounce from 'lodash.debounce';
import { MediumText, BaseText } from 'components/Typography';
import Icon from 'components/Icon';
import Spinner from 'components/Spinner';
import { fontSizes, spacing } from 'utils/variables';
import { responsiveSize } from 'utils/ui';
import type { Theme } from 'models/Theme';
import { getThemeColors, themedColors } from 'utils/themes';

export type Props = {
  children?: React.Node,
  title: string,
  onPress?: Function,
  disabled?: boolean,
  disabledTransparent?: boolean,
  secondary?: boolean,
  secondaryTransparent?: boolean,
  danger?: boolean,
  primaryInverted?: boolean,
  dangerInverted?: boolean,
  marginBottom?: string,
  marginTop?: string,
  marginLeft?: string,
  marginRight?: string,
  light?: boolean,
  width?: string,
  block?: boolean,
  noPadding?: boolean,
  flexRight?: boolean,
  small?: boolean,
  extraSmall?: boolean,
  icon?: string,
  iconSize?: string,
  listItemButton?: boolean,
  height?: number,
  debounceTime?: number,
  textStyle?: ?Object,
  style?: Object,
  isLoading?: boolean,
  regularText?: boolean,
  theme: Theme,
};

type State = {
  shouldIgnoreTap: boolean,
};

type ButtonNextProps = {
  onPress: Function,
  disabled?: boolean,
};

const themes = {
  primary: {
    borderWidth: 0,
    shadow: true,
  },
  primaryInverted: {
    borderWidth: '1px',
  },
  dangerInverted: {
    borderWidth: '1px',
  },
  secondary: {
    borderWidth: '1px',
  },
  secondaryTransparent: {
    borderWidth: '1px',
  },
  secondaryTransparentDisabled: {
    borderWidth: '1px',
    opacity: 0.5,
  },
  secondaryDanger: {
    borderWidth: 0,
  },
  danger: {
    borderWidth: 0,
  },
  dark: {
    borderWidth: 0,
  },
  disabled: {
    borderWidth: 0,
    opacity: 0.5,
  },
  disabledTransparent: {
    opacity: 0.5,
  },
  squarePrimary: {
    borderWidth: 0,
    flexDirection: 'column',
    borderRadius: 0,
    iconHorizontalMargin: 0,
  },
  squareDanger: {
    borderWidth: 0,
    flexDirection: 'column',
    borderRadius: 0,
    iconHorizontalMargin: 0,
  },
};

const themeColors = (theme: Theme) => {
  const {
    primary,
    tertiary,
    secondaryText,
    control,
    negative,
  } = getThemeColors(theme);

  return {
    primary: {
      surface: primary,
      text: control,
      border: primary,
    },
    primaryInverted: {
      surface: 'transparent',
      text: primary,
    },
    dangerInverted: {
      surface: 'transparent',
      text: negative,
      border: negative,
    },
    secondary: {
      surface: 'transparent',
      text: primary,
    },
    secondaryTransparent: {
      background: 'transparent',
      text: control,
      border: primary,
    },
    secondaryTransparentDisabled: {
      background: 'transparent',
      text: secondaryText,
    },
    secondaryDanger: {
      surface: 'transparent',
      text: negative,
    },
    danger: {
      background: negative,
      text: control,
    },
    dark: {
      background: tertiary,
      color: control,
      borderColor: tertiary,
    },
    disabled: {
      surface: primary,
      text: control,
      border: primary,
    },
    disabledTransparent: {
      surface: primary,
      text: control,
      border: primary,
    },
    squarePrimary: {
      surface: 'transparent',
      text: primary,
      border: 'transparent',
    },
    squareDanger: {
      surface: 'transparent',
      text: negative,
      border: 'transparent',
    },
  };
};

const getButtonHeight = (props) => {
  if (props.height) {
    return `${props.height}px`;
  }

  if (props.small) {
    return '34px';
  }

  return '56px';
};

const getButtonWidth = (props) => {
  if (props.square) {
    return getButtonHeight(props);
  }

  if (props.block) {
    return '100%';
  }

  if (props.width) {
    return props.width;
  }

  return 'auto';
};

const getButtonPadding = (props) => {
  if (props.noPadding) {
    return '0';
  }

  if (props.small || props.block) {
    return `${spacing.rhythm}px`;
  }

  if (props.square) {
    return '4px';
  }

  return `${spacing.rhythm * 1.5}px`;
};

const getButtonFontSize = (props) => {
  if (props.listItemButton) {
    return `${fontSizes.regular}px`;
  }

  if (props.small) {
    return `${fontSizes.regular}px`;
  }

  if (props.extraSmall) {
    return `${fontSizes.small}px`;
  }
  return `${fontSizes.big}px`;
};

const ButtonIcon = styled(Icon)`
  font-size: ${({ iconSize = 'medium' }) => fontSizes[iconSize]};
  margin-horizontal: ${props => props.customTheme.iconHorizontalMargin || props.customTheme.iconHorizontalMargin === 0
    ? props.customTheme.iconHorizontalMargin
    : props.marginRight || 8}px;
  color: ${({ theme }) => theme.colors.text};
  line-height: ${props => getButtonFontSize(props)};
`;

const ButtonWrapper = styled.TouchableOpacity`
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  padding: 0 ${props => getButtonPadding(props)};
  background-color: ${({ theme }) => theme.colors.surface};
  opacity: ${props => props.customTheme.opacity ? props.customTheme.opacity : 1};
  margin-top: ${props => props.marginTop || '0px'};
  margin-bottom: ${props => props.marginBottom || '0px'};
  margin-left: ${props => props.marginLeft || '0px'};
  margin-right: ${props => props.marginRight || '0px'};
  border-radius: ${props => props.customTheme.borderRadius || props.borderRadius || 0}px;
  width: ${props => getButtonWidth(props)};
  height: ${props => getButtonHeight(props)};
  align-self: ${props => props.flexRight ? 'flex-end' : 'auto'};
  border-color: ${({ theme }) => theme.colors.border};
  border-width: ${props => props.customTheme.borderWidth};
  border-style: solid;
  flex-direction: ${props => props.customTheme.flexDirection ? props.customTheme.flexDirection : 'row'}
  ${props => props.customTheme.shadow ? 'box-shadow: 0px 2px 7px rgba(0,0,0,.12);' : ''}
  ${props => props.customTheme.shadow ? 'elevation: 1;' : ''}
`;

const buttonTextStyle = (props) => `
  color: ${props.theme.colors.text};
  font-size: ${getButtonFontSize(props)};
  margin-bottom: ${props.extraSmall ? '2px' : 0};`;

const ButtonText = styled(MediumText)`
  ${props => buttonTextStyle(props)};
`;

const ButtonTextRegular = styled(BaseText)`
  ${props => buttonTextStyle(props)};
`;

const ButtonMiniWrapper = styled(NBButton)`
  padding: 10px 20px;
  background-color: ${themedColors.primary};
  border-radius: 17;
  box-shadow: 0px .5px .5px ${themedColors.primary};
  height: 34px;
  width: auto;
`;

const ButtonMiniText = styled(MediumText)`
  font-size: ${fontSizes.regular}px;
  letter-spacing: 0.3;
  color: #fff;
`;

const ButtonNextWrapper = styled.TouchableOpacity`
  width: ${responsiveSize(70)}px;
  height: ${responsiveSize(70)}px;
  border-radius: 4px;
  background-color: ${themedColors.primary};
  align-items: center;
  justify-content: center;
  ${({ disabled }) => disabled && 'opacity: 0.5;'}
`;

const NextIcon = styled(Icon)`
  font-size: ${fontSizes.large}px;
  color: ${themedColors.control};
  transform: rotate(180deg);
`;

const getThemeType = (props: Props, isForColors?: boolean) => {
  if (props.secondary && props.danger) {
    return 'secondaryDanger';
  }

  if (props.secondaryTransparent && props.disabled) {
    return 'secondaryTransparentDisabled';
  }

  const propsKeys = Object.keys(props);
  const themesKeys = Object.keys(themes);
  const themeColorsKeys = Object.keys(themeColors(props.theme));
  let themeToUse = 'primary';

  propsKeys.forEach((prop: string) => {
    const indexOfTheme = isForColors ? themeColorsKeys.indexOf(prop) : themesKeys.indexOf(prop);
    const existTheme = indexOfTheme >= 0;

    if (existTheme && props[prop]) {
      themeToUse = prop;
    }
  });

  return themeToUse;
};

class Button extends React.Component<Props, State> {
  static defaultProps = {
    debounceTime: 400,
  };

  state = { shouldIgnoreTap: false };
  ignoreTapTimeout = null;

  componentWillUnmount() {
    if (this.ignoreTapTimeout) {
      clearTimeout(this.ignoreTapTimeout);
      this.ignoreTapTimeout = null;
    }
  }

  handlePress = () => {
    this.setState({ shouldIgnoreTap: true });
    if (this.props.onPress) this.props.onPress();

    this.ignoreTapTimeout = setTimeout(() => {
      this.setState({ shouldIgnoreTap: false });
    }, 1000);
  };

  renderButtonText = (customTheme: Object, updatedTheme: Theme) => {
    const {
      small,
      extraSmall,
      listItemButton,
      textStyle,
      title,
      regularText,
    } = this.props;

    if (listItemButton || extraSmall || regularText) {
      return (
        <ButtonTextRegular theme={updatedTheme} customTheme={customTheme} small={small} style={textStyle}>
          {title}
        </ButtonTextRegular>
      );
    }

    return (
      <ButtonText theme={updatedTheme} customTheme={customTheme} small={small} style={textStyle}>
        {title}
      </ButtonText>
    );
  };

  render() {
    const customTheme = themes[getThemeType(this.props)];
    const {
      disabled,
      disabledTransparent,
      children,
      isLoading,
      style = {},
      theme,
    } = this.props;

    const updatedColors = themeColors(theme)[getThemeType(this.props, true)];
    const updatedTheme = { ...theme, colors: { ...theme.colors, ...updatedColors } };

    return (
      <ButtonWrapper
        {...this.props}
        theme={updatedTheme}
        customTheme={customTheme}
        onPress={debounce(this.handlePress, this.props.debounceTime, { leading: true, trailing: false })}
        disabled={disabled || disabledTransparent || this.state.shouldIgnoreTap || isLoading}
        borderRadius={this.props.small ? 3 : 6}
        style={isLoading ? { ...style, backgroundColor: 'transparent' } : style}

      >
        {!!isLoading && <Spinner width={20} height={20} />}
        {!!this.props.icon && !isLoading &&
          <ButtonIcon
            marginRight={this.props.marginRight}
            iconSize={this.props.iconSize}
            name={this.props.icon}
            customTheme={customTheme}
            theme={updatedTheme}
          />
        }
        {!!this.props.title && !isLoading && this.renderButtonText(customTheme, updatedTheme)}
        {children}
      </ButtonWrapper>
    );
  }
}

export default withTheme(Button);

type ButtonMiniProps = {
  onPress: Function,
  title: string,
};

export const ButtonMini = (props: ButtonMiniProps) => (
  <ButtonMiniWrapper onPress={props.onPress}>
    <ButtonMiniText>{props.title}</ButtonMiniText>
  </ButtonMiniWrapper>
);

export const ButtonNext = (props: ButtonNextProps) => {
  const { onPress, disabled } = props;
  return (
    <ButtonNextWrapper
      onPress={onPress}
      disabled={disabled}
    >
      <NextIcon name="back" />
    </ButtonNextWrapper>
  );
};

type TooltipButtonProps = {
  onPress: Function,
};

const TooltipButtonWrapper = styled(BaseText)`
  font-size: ${({ fontSize }) => fontSize || fontSizes.tiny};
  ${({ color, theme }) => `
    color: ${color || theme.colors.secondaryText};
    border-color: ${color || theme.colors.secondaryText};
  `}
  ${({ buttonSize = 16 }) => `
    line-height: ${buttonSize - 2}px;
    width: ${buttonSize}px;
    height: ${buttonSize}px;
    border-radius: ${buttonSize / 2}px;
  `}
  text-align: center;
  border-width: 1px;
`;

export const TooltipButton = ({ onPress }: TooltipButtonProps) => (
  <TouchableOpacity onPress={onPress}>
    <TooltipButtonWrapper>?</TooltipButtonWrapper>
  </TouchableOpacity>
);
