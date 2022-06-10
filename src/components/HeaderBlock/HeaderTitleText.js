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
import { fontSizes, appFont } from 'utils/variables';
import { MediumText } from 'components/legacy/Typography';

type Props = {
  centerText?: boolean,
  color?: string,
  style?: Object,
};

const StyledText = styled(MediumText)`
  font-size: ${fontSizes.big}px;
  line-height: 20px;
  color: ${({ color, theme }) => color || theme.colors.basic010};
  text-align: ${(props) => (props.centerText ? 'center' : 'left')};
  font-family: ${appFont.medium};
`;

const HeaderTitleText = (props: Props) => <StyledText {...props} ellipsizeMode="tail" numberOfLines={2} />;

export default HeaderTitleText;
