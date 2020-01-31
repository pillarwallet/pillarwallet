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
import { MediumText } from 'components/Typography';
import { themedColors } from 'utils/themes';

type Props = {
  label: string,
  containerStyle?: Object,
  labelStyle?: Object,
  color?: string,
}

const BadgeWrapper = styled.View`
  background-color: ${props => props.color || themedColors.positive};
  padding: 3px 8px;
  border-radius: 12px;
  align-self: flex-start;
`;

const Label = styled(MediumText)`
  font-size: 8px;
  color: ${themedColors.control};
`;

export const LabelBadge = (props: Props) => {
  const {
    label,
    containerStyle,
    labelStyle,
    color,
  } = props;
  return (
    <BadgeWrapper style={containerStyle} color={color}>
      <Label style={labelStyle}>
        {label}
      </Label>
    </BadgeWrapper>
  );
};
