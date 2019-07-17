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

type Props = {
  theme: Object,
  label: string,
  action: Function,
  hasChevron?: boolean,
}

const HeaderButtonRounded = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 4px 12px;
  border: 1px solid;
  border-color: ${props => props.theme.buttonBorderColor || UIColors.defaultBorderColor};
  border-radius: 20px;
  margin-right: 6px;
`;

const RoundedButtonLabel = styled(BaseText)`
  line-height: ${fontSizes.small};
  font-size: ${fontSizes.extraSmall}px;
  color: ${props => props.theme.buttonLabelColor || UIColors.defaultTextColor};
  font-weight: ${Platform.select({
    ios: '500',
    android: '400',
  })};
`;
const ChevronIcon = styled(Icon)`
  font-size: 6px;
  color: ${baseColors.white};
  transform: rotate(90deg);
  margin-top: 2px;
  margin-left: 9px;
`;

export const HeaderActionButton = (props: Props) => {
  const {
    theme,
    label,
    action,
    hasChevron,
  } = props;

  return (
    <HeaderButtonRounded onPress={action} theme={theme}>
      <RoundedButtonLabel theme={theme}>{label}</RoundedButtonLabel>
      {!!hasChevron && <ChevronIcon name="chevron-right" />}
    </HeaderButtonRounded>
  );
};
