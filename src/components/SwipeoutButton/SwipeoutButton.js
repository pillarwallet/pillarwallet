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

// components
import { BaseText } from 'components/legacy/Typography';
import Icon from 'components/legacy/Icon';

// utils
import { fontSizes } from 'utils/variables';


type Props = {
  iconName: string,
  label: string,
  color: string,
  onPress?: () => void,
  expanded?: boolean,
  disabled?: boolean,
};

const ButtonWrapper = styled.TouchableOpacity`
  padding: 10px;
  justify-content: center;
  align-items: center;
  flex: 1;
  background-color: ${({ theme }) => theme.colors.basic070};
`;

const ButtonLabel = styled(BaseText)`
  color: ${({ color }) => color};
  ${({ expanded, disabled }) => `
    font-size: ${expanded ? fontSizes.regular : fontSizes.small}px;
    opacity: ${disabled ? 0.5 : 1}
  `}
  margin-top: 8px;
`;

const StyledIcon = styled(Icon)`
  color: ${({ color }) => color};
  ${({ expanded, disabled }) => `
    font-size: ${expanded ? fontSizes.big : fontSizes.medium}px;
    opacity: ${disabled ? 0.5 : 1}
  `}
`;

const SwipeoutButton = ({
  onPress,
  expanded,
  disabled,
  iconName,
  label,
  color,
}: Props) => (
  <ButtonWrapper onPress={onPress} activeOpacity={0.8}>
    <StyledIcon name={iconName} disabled={disabled} color={color} />
    <ButtonLabel expanded={expanded} disabled={disabled} color={color}>
      {label}
    </ButtonLabel>
  </ButtonWrapper>
);

export default SwipeoutButton;
