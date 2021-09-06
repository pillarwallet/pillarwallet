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
import { BaseText } from 'components/legacy/Typography';
import { fontSizes } from 'utils/variables';


type Props = {
  label: string,
  color?: string,
};

const BadgeWrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

const Bullet = styled.View`
  background-color: ${({ color, theme }) => color || theme.colors.primaryAccent130};
  height: 10px;
  width: 10px;
  border-radius: 10px;
  margin-right: 4px;
`;

const Label = styled(BaseText)`
  font-size: ${fontSizes.tiny}px;
`;

export const LabelBulleted = (props: Props) => {
  const { label, color } = props;
  return (
    <BadgeWrapper {...props}>
      <Bullet color={color} />
      <Label>{label}</Label>
    </BadgeWrapper>
  );
};
