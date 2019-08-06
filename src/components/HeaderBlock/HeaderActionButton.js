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
import { Platform } from 'react-native';
import styled from 'styled-components/native';
import { baseColors, fontSizes, UIColors } from 'utils/variables';
import { BaseText } from 'components/Typography';
import Icon from 'components/Icon';
import Animation from 'components/Animation';

type Props = {
  theme: Object,
  label: string,
  onPress: Function,
  hasChevron?: boolean,
  isActive?: boolean,
}

const HeaderButtonRounded = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 4px 12px 4px 6px;
  border: 1px solid;
  border-color: ${props => props.theme.buttonBorderColor || UIColors.defaultBorderColor};
  border-radius: 20px;
`;

const RoundedButtonLabel = styled(BaseText)`
  line-height: ${fontSizes.small};
  font-size: ${fontSizes.extraSmall}px;
  color: ${props => props.theme.buttonLabelColor || UIColors.defaultTextColor};
  font-weight: ${Platform.select({
    ios: '500',
    android: '400',
  })};
  margin-left: 6px;
`;
const ChevronIcon = styled(Icon)`
  font-size: 6px;
  color: ${props => props.theme.buttonLabelColor || UIColors.defaultTextColor};
  transform: rotate(90deg);
  margin-top: 2px;
  margin-left: 9px;
`;

const StatusIcon = styled.View`
  height: 8px;
  width: 8px;
  border-radius: 4px;
  background-color: ${props => props.isActive ? baseColors.fruitSalad : baseColors.fireEngineRed};
  position: absolute;
  top: 5px;
  left: 5px;
`;

const StatusIndicatorHolder = styled.View`
  position: relative;
  width: 15px;
  height: 18px;
`;

const StyledAnimation = styled(Animation)`
  position: absolute;
  top: ${Platform.select({
    ios: '-0.8px',
    android: '-1px',
  })};
  left: ${Platform.select({
    ios: '-0.8px',
    android: '-1px',
  })};
  width: 22px;
  height: 22px;
`;

const animationSource = require('assets/animations/livePulsatingAnimation.json');

const Status = ({ isActive }) => {
  return (
    <StatusIndicatorHolder>
      {!!isActive && <StyledAnimation source={animationSource} loop speed={0.9} />}
      <StatusIcon isActive={isActive} />
    </StatusIndicatorHolder>
  );
};

export const HeaderActionButton = (props: Props) => {
  const {
    theme,
    label,
    onPress,
    hasChevron,
    isActive,
  } = props;

  return (
    <HeaderButtonRounded onPress={onPress} theme={theme}>
      {isActive !== undefined && <Status isActive={isActive} />}
      <RoundedButtonLabel theme={theme}>{label}</RoundedButtonLabel>
      {!!hasChevron && <ChevronIcon name="chevron-right" theme={theme} />}
    </HeaderButtonRounded>
  );
};

// {isActive !== undefined && <Status isActive={isActive} />} { /* value might be TRUE or FALSE */ }
