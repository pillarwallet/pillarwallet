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
import { ImageBackground, Image } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import { fontSizes, fontTrackings } from 'utils/variables';
import { BaseText } from 'components/Typography';
import Icon from 'components/Icon';
import { getThemeColors, getThemeType, themedColors } from 'utils/themes';
import type { Theme } from 'models/Theme';
import { DARK_THEME, LIGHT_THEME } from 'constants/appSettingsConstants';

type Props = {
  disabled?: boolean,
  onPress: Function,
  label: string,
  icon?: string,
  fontIcon?: string,
  fontIconStyle?: Object,
  showIndicator?: boolean,
  theme: Theme,
}

type ButtonIconWrapperProps = {
  disabled?: boolean,
  showIndicator?: boolean,
  themeType: string,
  children: React.Node,
}

const CircleButtonIconWrapperColors = ['#ffffff', '#f2f4f9'];

const CircleButtonWrapper = styled.TouchableOpacity`
  justify-content: center;
  align-items: center;
  padding: 8px 4px 0px;
`;

const ButtonWrapperStyles = `
  justify-content: center;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const CircleButtonIconWrapper = styled.View`
  border-radius: 46px;
  width: 92px;
  height: 92px;
  ${ButtonWrapperStyles}
`;

const CircleButtonIcon = styled(Image)`
  height: 24px;
  width: 24px;
  opacity: ${props => props.disabled ? 0.3 : 1};
  justify-content: center;
  display: flex;
`;

const CircleButtonText = styled(BaseText)`
  color: ${themedColors.primary};
  opacity: ${props => props.disabled ? 0.5 : 1};
  text-align: center;
  font-size: ${fontSizes.medium}px;
  letter-spacing: ${fontTrackings.tiny}px;
  margin-top: -6px;
`;

const Indicator = styled.View`
  width: 12px;
  height: 12px;
  background-color: ${themedColors.indicator};
  border-radius: 6px;
  position: absolute;
  top: ${({ topPos }) => topPos}px;
  right: ${({ rightPos }) => rightPos}px;
`;

const actionButtonBackground = require('assets/images/bg_action_button.png');
const actionButtonBackgroundDisabled = require('assets/images/bg_action_button_disabled.png');
const actionButtonBackgroundDark = require('assets/images/bg_action_button_dark.png');

function getButtonBackgroundSource(themeType, isDisabled) {
  if (themeType === DARK_THEME) {
    return actionButtonBackgroundDark;
  } else if (isDisabled) {
    return actionButtonBackgroundDisabled;
  }
  return actionButtonBackground;
}

const ButtonIconWrapper = (props: ButtonIconWrapperProps) => {
  const {
    disabled,
    showIndicator,
    themeType,
    children,
  } = props;

  const buttonBackground = getButtonBackgroundSource(themeType, disabled);
  return (
    <ImageBackground
      source={buttonBackground}
      style={{ width: 92, height: 92 }}
      opacity={themeType === DARK_THEME && disabled ? 0.5 : 1}
    >
      <CircleButtonIconWrapper
        disabled={disabled}
        colors={CircleButtonIconWrapperColors}
      >
        {children}
        {showIndicator && <Indicator topPos={17} rightPos={17} />}
      </CircleButtonIconWrapper>
    </ImageBackground>
  );
};

const CircleButton = (props: Props) => {
  const {
    disabled,
    icon,
    fontIcon,
    fontIconStyle,
    onPress,
    label,
    theme,
  } = props;

  const colors = getThemeColors(theme);
  const themeType = getThemeType(theme);
  const iconOpacity = themeType === LIGHT_THEME && disabled ? 0.3 : 1;

  return (
    <CircleButtonWrapper
      disabled={disabled}
      onPress={() => onPress()}
    >
      <ButtonIconWrapper {...props} themeType={themeType}>
        {!!icon &&
        <CircleButtonIcon
          disabled={disabled}
          source={icon}
          resizeMode="contain"
          resizeMethod="resize"
        />}
        {!!fontIcon &&
        <Icon
          name={fontIcon}
          style={{
            fontSize: 22,
            color: colors.primary,
            alignSelf: 'center',
            ...fontIconStyle,
            opacity: iconOpacity,
          }}
        />}
      </ButtonIconWrapper>
      <CircleButtonText disabled={disabled}>
        {label}
      </CircleButtonText>
    </CircleButtonWrapper>
  );
};

export default withTheme(CircleButton);
