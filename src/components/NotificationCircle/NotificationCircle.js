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
import { BaseText } from 'components/legacy/Typography';

type Props = {
  children?: React.Node,
  style?: Object,
  gray: boolean,
}

const NotificationCircleOuter = styled.View`
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background: ${({ gray, theme }) => gray ? theme.colors.tertiary : theme.colors.indicator};
  align-items: center;
  justify-content: center;
`;

const NotificationCircleText = styled(BaseText)`
  font-size: ${fontSizes.small}px;
  color: ${({ gray, theme }) => gray ? theme.colors.control : theme.colors.text};
`;

const NotificationCircle = (props: Props) => {
  return (
    <NotificationCircleOuter style={props.style} gray={props.gray}>
      <NotificationCircleText gray={props.gray}>
        {props.children}
      </NotificationCircleText>
    </NotificationCircleOuter>
  );
};

export default NotificationCircle;
