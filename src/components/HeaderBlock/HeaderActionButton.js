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
import styled from 'styled-components/native';
import { fontSizes } from 'utils/variables';
import { MediumText } from 'components/Typography';
import Icon from 'components/Icon';
import Animation from 'components/Animation';
import { themedColors } from 'utils/themes';

type Props = {
  label: string,
  onPress: Function,
  hasChevron?: boolean,
  isActive?: boolean,
  wrapperStyle?: Object,
  backgroundColor?: string,
}

const HeaderButtonRounded = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 2px 6px;
  border: 1px solid;
  border-color: ${props => props.backgroundColor ? 'transparent' : themedColors.border};
  background-color: ${props => props.backgroundColor ? props.backgroundColor : 'transparent'};
  border-radius: 6px;
`;

const RoundedButtonLabel = styled(MediumText)`
  font-size: ${fontSizes.regular};
  line-height: 20px;
  color: ${props => props.isLight ? themedColors.control : themedColors.text};
  margin-left: 6px;
`;
const ChevronIcon = styled(Icon)`
  font-size: 6px;
  color: ${props => props.isLight ? themedColors.control : themedColors.text};
  transform: rotate(90deg);
  margin-top: 2px;
  margin-left: 9px;
  margin-right: 4px;
`;

const StatusIcon = styled.View`
  height: 8px;
  width: 8px;
  border-radius: 4px;
  background-color: ${({ isActive, theme }) => isActive ? theme.colors.positive : theme.colors.negative};
`;

const StatusIndicatorHolder = styled.View`
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
`;

const AnimationWrapper = styled.View`
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  bottom: 0;
`;

const StyledAnimation = styled(Animation)`
  width: 22px;
  height: 22px;
`;

const animationSource = require('assets/animations/livePulsatingAnimation.json');

const Status = ({ isActive }) => {
  return (
    <StatusIndicatorHolder>
      {!!isActive && <AnimationWrapper><StyledAnimation source={animationSource} loop speed={0.9} /></AnimationWrapper>}
      <StatusIcon isActive={isActive} />
    </StatusIndicatorHolder>
  );
};

const HeaderActionButton = (props: Props) => {
  const {
    label,
    onPress,
    hasChevron,
    isActive,
    wrapperStyle,
    backgroundColor,
  } = props;

  return (
    <HeaderButtonRounded onPress={onPress} backgroundColor={backgroundColor} style={wrapperStyle}>
      {isActive !== undefined && <Status isActive={isActive} />}
      <RoundedButtonLabel isLight={!!backgroundColor}>{label}</RoundedButtonLabel>
      {!!hasChevron && <ChevronIcon name="chevron-right" isLight={!!backgroundColor} />}
    </HeaderButtonRounded>
  );
};

export default HeaderActionButton;

