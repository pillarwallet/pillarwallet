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
import { MediumText } from 'components/legacy/Typography';
import Icon from 'components/legacy/Icon';
import { fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';


type Props = {
  title: string,
  iconName: string,
  wrapperStyle?: Object,
  iconSize?: number,
};

const TitleWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  margin: 10px 0;
`;

const TitleText = styled(MediumText)`
  ${fontStyles.regular};
`;

const StyledIcon = styled(Icon)`
  margin-right: 4px;
  color: ${themedColors.accent};
  ${({ size }) => `font-size: ${size || '24'}px`}
`;

const TitleWithIcon = (props: Props) => {
  const {
    title,
    iconName,
    wrapperStyle,
    iconSize,
  } = props;

  return (
    <TitleWrapper style={wrapperStyle}>
      <StyledIcon name={iconName} size={iconSize} />
      <TitleText>{title}</TitleText>
    </TitleWrapper>
  );
};

export default TitleWithIcon;
