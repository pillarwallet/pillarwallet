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
import styled, { withTheme } from 'styled-components/native';
import themeVariant from 'styled-theming';
import debounce from 'lodash.debounce';
import { BaseText } from 'components/legacy/Typography';
import Icon from 'components/legacy/Icon';
import Spinner from 'components/Spinner';
import { fontSizes, appFont, spacing } from 'utils/variables';
import { DARK_THEME, LIGHT_THEME } from 'constants/appSettingsConstants';
import { getThemeColors, getThemeType } from 'utils/themes';

// types
import type { ViewStyleProp, TextStyleProp } from 'utils/types/react-native';
import type { Theme } from 'models/Theme';

export type Props = {|
  children?: React.Node,
  title: string,
  onPress?: Function,
  disabled?: boolean,
  secondary?: boolean,
  danger?: boolean,
  marginBottom?: number,
  marginTop?: number,
  marginLeft?: number,
  marginRight?: number,
  width?: string | number,
  height?: string | number,
  block?: boolean,
  flexRight?: boolean,
  small?: boolean,
  debounceTime?: number,
  textStyle?: TextStyleProp,
  style?: ViewStyleProp,
  isLoading?: boolean,
  leftIconName?: string,
  leftIconStyle?: ViewStyleProp,
  rightIconName?: string,
  rightIconStyle?: ViewStyleProp,
  horizontalPaddings?: number,
  transparent?: boolean,
  primarySecond?: boolean,
  warning?: boolean,
  testID?: string,
  accessibilityLabel?: string,
|};

type CombinedProps = {|
  ...Props,
  theme: Theme,
|};

type State = {
  shouldIgnoreTap: boolean,
};

const getButtonHeight = (props) => {
  if (props.height) {
    return `${props.height}px`;
  }

  if (props.small) {
    return '32px';
  }

  return '72px';
};

const getButtonWidth = (props) => {
  if (!props.block || props.transparent) return null;
  let customWidth = '100%';
  if (props.width) customWidth = props.width;
  return `width: ${customWidth}`;
};

const getButtonPadding = (props) => {
  if (props.horizontalPaddings) {
    return `${props.horizontalPaddings}px`;
  }

  if (props.small || props.block) {
    return `${spacing.rhythm}px`;
  }

  return '34px';
};

const getButtonFontSize = (props) => {
  if (props.small) {
    return fontSizes.regular;
  }
  return fontSizes.medium;
};

const VARIANT = {
  DEFAULT: 'default',
  PRIMARY_SECOND: 'primarySecond',
  SECONDARY: 'secondary',
  DANGER: 'danger',
  TRANSPARENT: 'transparent',
  TRANSPARENT_DANGER: 'transparentDanger',
  DISABLE: 'disabled',
  WARNING: 'warning',
};

// THEME
const backgroundColor = themeVariant.variants('current', 'variant', {
  [VARIANT.DEFAULT]: {
    lightTheme: (props) => props.theme.colors.buttonPrimaryBackground,
    darkTheme: (props) => props.theme.colors.buttonPrimaryBackground,
  },
  [VARIANT.WARNING]: {
    lightTheme: (props) => props.theme.colors.negative,
    darkTheme: (props) => props.theme.colors.negative,
  },
  [VARIANT.PRIMARY_SECOND]: {
    lightTheme: (props) => props.theme.colors.secondaryAccent140,
    darkTheme: (props) => props.theme.colors.primaryAccent220,
  },
  [VARIANT.SECONDARY]: {
    lightTheme: (props) => props.theme.colors.basic060,
    darkTheme: (props) => props.theme.colors.basic020,
  },
  [VARIANT.DANGER]: {
    lightTheme: (props) => props.theme.colors.secondaryAccent240,
    darkTheme: (props) => props.theme.colors.secondaryAccent240,
  },
  [VARIANT.DISABLE]: {
    lightTheme: (props) => props.theme.colors.basic60,
    darkTheme: (props) => props.theme.colors.basic60,
  },
  [VARIANT.TRANSPARENT]: {
    lightTheme: 'transparent',
    darkTheme: 'transparent',
  },
  [VARIANT.TRANSPARENT_DANGER]: {
    lightTheme: 'transparent',
    darkTheme: 'transparent',
  },
});

const contentColor = themeVariant.variants('current', 'variant', {
  [VARIANT.DEFAULT]: {
    lightTheme: (props) => props.theme.colors.buttonPrimaryTitle,
    darkTheme: (props) => props.theme.colors.buttonPrimaryTitle,
  },
  [VARIANT.WARNING]: {
    lightTheme: (props) => props.theme.colors.buttonPrimaryTitle,
    darkTheme: (props) => props.theme.colors.buttonPrimaryTitle,
  },
  [VARIANT.PRIMARY_SECOND]: {
    lightTheme: (props) => props.theme.colors.basic050,
    darkTheme: (props) => props.theme.colors.basic090,
  },
  [VARIANT.SECONDARY]: {
    lightTheme: (props) => props.theme.colors.primaryAccent130,
    darkTheme: (props) => props.theme.colors.basic090,
  },
  [VARIANT.DANGER]: {
    lightTheme: (props) => props.theme.colors.basic050,
    darkTheme: (props) => props.theme.colors.basic090,
  },
  [VARIANT.TRANSPARENT]: {
    lightTheme: (props) => props.theme.colors.primaryAccent130,
    darkTheme: (props) => props.theme.colors.basic000,
  },
  [VARIANT.DISABLE]: {
    lightTheme: (props) => props.theme.colors.labelTertiary,
    darkTheme: (props) => props.theme.colors.basic020,
  },
  [VARIANT.TRANSPARENT_DANGER]: {
    lightTheme: (props) => props.theme.colors.secondaryAccent240,
    darkTheme: (props) => props.theme.colors.secondaryAccent240,
  },
});

const getLabelTopMargin = (props) => {
  return getButtonFontSize(props) * 0.18;
};

const getButtonOpacity = ({ disabled, theme }) => {
  if (disabled) {
    if (theme.current === DARK_THEME) return 0.7;
    return 0.8;
  }
  return 1;
};

const ButtonIcon = styled(Icon)`
  font-size: ${(props) => getButtonFontSize(props)}px;
  ${({ isOnLeft }) => (isOnLeft ? 'margin-right: 6px;' : 'margin-left: 6px;')}
  color: ${contentColor};
  height: ${(props) => getButtonFontSize(props)}px;
`;

const ButtonWrapper = styled.TouchableOpacity`
  align-items: center;
  justify-content: center;
  flex-direction: row;
  padding: 0 ${(props) => getButtonPadding(props)};
  background-color: ${backgroundColor};
  opacity: ${(props) => getButtonOpacity(props)};
  margin-top: ${(props) => props.marginTop || 0}px;
  margin-bottom: ${(props) => props.marginBottom || 0}px;
  margin-left: ${(props) => props.marginLeft || 0}px;
  margin-right: ${(props) => props.marginRight || 0}px;
  border-radius: ${({ borderRadius }) => borderRadius}px;
  ${(props) => getButtonWidth(props)};
  height: ${(props) => getButtonHeight(props)};
  align-self: ${(props) => (props.flexRight ? 'flex-end' : 'auto')};
`;

const ButtonText = styled(BaseText)`
  color: ${contentColor};
  font-size: ${(props) => getButtonFontSize(props)}px;
  line-height: ${(props) => getButtonFontSize(props)}px;
  margin-top: ${(props) => getLabelTopMargin(props)}px;
  // font-family: ${appFont.medium};
  text-align: center;
`;

const getVariant = (props) => {
  if (props.danger && props.transparent) {
    return VARIANT.TRANSPARENT_DANGER;
  }
  if (props.danger) {
    return VARIANT.DANGER;
  }
  if (props.warning) {
    return VARIANT.WARNING;
  }
  if (props.primarySecond) {
    return VARIANT.PRIMARY_SECOND;
  }
  if (props.secondary) {
    return VARIANT.SECONDARY;
  }
  if (props.transparent) {
    return VARIANT.TRANSPARENT;
  }
  if (props.disabled) {
    return VARIANT.DISABLE;
  }
  return VARIANT.DEFAULT;
};

/**
 * @deprecated This compontent is considered legacy and should not be used in new code
 *
 * Use: components/core/Button instead
 */

class Button extends React.Component<CombinedProps, State> {
  static defaultProps = {
    debounceTime: 400,
    block: true,
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

  renderButtonContent = (variant: string) => {
    const { isLoading, title, leftIconName, leftIconStyle, rightIconName, rightIconStyle, small, textStyle, theme } =
      this.props;
    const themeType = getThemeType(theme);
    const colors = getThemeColors(theme);

    if (isLoading) {
      return (
        <Spinner
          size={small ? 16 : 24}
          trackWidth={small ? 1 : 2}
          basic
          style={{ paddingLeft: 8, paddingRight: 8 }}
          color={
            (themeType === LIGHT_THEME && variant === VARIANT.SECONDARY) || variant === VARIANT.TRANSPARENT
              ? colors.basic010
              : null
          }
        />
      );
    }

    return (
      <>
        {!!leftIconName && <ButtonIcon name={leftIconName} isOnLeft style={leftIconStyle} variant={variant} />}
        {!!title && (
          <ButtonText small={small} style={textStyle} variant={variant}>
            {title}
          </ButtonText>
        )}
        {!!rightIconName && <ButtonIcon name={rightIconName} style={rightIconStyle} variant={variant} />}
      </>
    );
  };

  render() {
    const { disabled, children, isLoading, style, small, debounceTime } = this.props;

    const variant = getVariant(this.props);

    return (
      <ButtonWrapper
        {...this.props}
        onPress={debounce(this.handlePress, debounceTime, { leading: true, trailing: false })}
        disabled={disabled || this.state.shouldIgnoreTap || isLoading}
        borderRadius={small ? 3 : 6}
        style={style}
        variant={variant}
        testID={this.props.testID}
        accessibilityLabel={this.props.accessibilityLabel}
      >
        {this.renderButtonContent(variant)}
        {children}
      </ButtonWrapper>
    );
  }
}

export default (withTheme(Button): React.ComponentType<Props>);
