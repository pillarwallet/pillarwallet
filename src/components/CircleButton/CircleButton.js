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
import { Image } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { fontSizes, fontTrackings } from 'utils/variables';
import { getColorByThemeOutsideStyled, getThemeColors, getThemeType, themedColors } from 'utils/themes';
import { BaseText } from 'components/legacy/Typography';
import Icon from 'components/legacy/Icon';
import { Shadow } from 'components/Shadow';
import { DARK_THEME, LIGHT_THEME } from 'constants/appSettingsConstants';
import { hexToRgba } from 'utils/ui';

// Types
import type { Theme, ThemeColors } from 'models/Theme';
import type { IconName } from 'components/legacy/Icon';


type Props = {
  disabled?: boolean,
  onPress: Function,
  label: string,
  icon?: string,
  fontIcon?: IconName,
  fontIconStyle?: Object,
  showIndicator?: boolean,
  theme: Theme,
};

type ButtonIconWrapperProps = {
  disabled?: boolean,
  showIndicator?: boolean,
  themeType: string,
  children: React.Node,
};

function getIconColor(colors: ThemeColors, isDisabled?: boolean, themeType: string) {
  if (themeType === DARK_THEME) {
    if (isDisabled) return colors.secondaryText;
    return colors.control;
  }
  return colors.primary;
}

function getLabelColor(theme: Theme, isDisabled: boolean) {
  const themeType = getThemeType(theme);
  const colors = getThemeColors(theme);
  if (themeType === LIGHT_THEME) {
    if (isDisabled) return colors.secondaryText;
    return colors.primary;
  }
  return colors.control;
}

const CircleButtonWrapper = styled.TouchableOpacity`
  justify-content: center;
  align-items: center;
  margin: 16px 5%;
`;

const CircleButtonIcon = styled(Image)`
  height: 24px;
  width: 24px;
  opacity: ${props => props.disabled ? 0.3 : 1};
  justify-content: center;
  display: flex;
`;

const CircleButtonText = styled(BaseText)`
  color: ${({ theme, disabled }) => getLabelColor(theme, disabled)};
  opacity: ${({ disabled, theme }) => getThemeType(theme) === DARK_THEME && disabled ? 0.5 : 1};
  text-align: center;
  font-size: ${fontSizes.medium}px;
  letter-spacing: ${fontTrackings.tiny}px;
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

const BUTTON_SIZE = 64;

const ButtonWrapper = styled.View`
  position: relative;
`;

const ButtonBackgroundHolder = styled.View`
  position: absolute;
  width: ${BUTTON_SIZE}px;
  height: ${BUTTON_SIZE}px;
  align-items: center;
  justify-content: center;
`;

const Border = styled.View`
  position: absolute;
  width: ${BUTTON_SIZE - 1}px;
  height: ${BUTTON_SIZE - 1}px;
  align-items: center;
  justify-content: center;
  border: ${({ borderColor }) => `0.5px solid ${borderColor}`};
  border-radius: ${(BUTTON_SIZE - 1) / 2}px;
`;

const ButtonBackground = styled(Svg)`
  position: absolute;
  width: ${BUTTON_SIZE}px;
  height: ${BUTTON_SIZE}px;
  align-items: center;
  justify-content: center;
`;

const ButtonIconWrapper = (props: ButtonIconWrapperProps) => {
  const {
    disabled,
    showIndicator,
    children,
    themeType,
  } = props;

  const gradientFirstColor = getColorByThemeOutsideStyled(themeType, {
    lightKey: 'basic070',
    darkCustom: '#4c4c4c',
  });
  const gradientSecondColor = getColorByThemeOutsideStyled(themeType, {
    lightCustom: '#f2f4f9',
    darkCustom: '#242525',
  });

  return (
    <ButtonWrapper>
      <Shadow
        useSVGShadow
        widthIOS={BUTTON_SIZE}
        heightIOS={BUTTON_SIZE}
        shadowRadius={BUTTON_SIZE / 2}
        wrapperStyle={{ margin: 4, marginBottom: 12 }}
        shadowOffsetY={4}
        shadowOpacity={!disabled && themeType !== DARK_THEME ? 0.05 : '0'}
        shadowColoriOS="#07007a"
      >
        <ButtonBackgroundHolder>
          <ButtonBackground width={BUTTON_SIZE} height={BUTTON_SIZE} viewBox={`0 0 ${BUTTON_SIZE} ${BUTTON_SIZE}`}>
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={gradientFirstColor} stopOpacity="1" />
                <Stop offset="1" stopColor={gradientSecondColor} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Circle cx={BUTTON_SIZE / 2} cy={BUTTON_SIZE / 2} r={BUTTON_SIZE / 2} fill="url(#grad)" />
          </ButtonBackground>
          <Border borderColor={hexToRgba(gradientFirstColor, themeType === DARK_THEME ? 0.3 : 1)} />
          {children}
        </ButtonBackgroundHolder>
      </Shadow>
      {showIndicator && <Indicator topPos={7} rightPos={7} />}
    </ButtonWrapper>
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
  const iconOpacity = disabled ? 0.5 : 1;

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
            color: getIconColor(colors, disabled, themeType),
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
