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
import { baseColors, fontSizes, spacing, fontWeights } from 'utils/variables';
import { BoldText, MediumText } from 'components/Typography';

type Props = {
  label: string,
  value: any,
  spacedOut?: boolean,
}

const ItemWrapper = styled.View`
  margin: ${spacing.rhythm / 2}px 0;
  flexDirection: column;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
`;

const ItemLabel = styled(MediumText)`
  text-align:center;
  font-size: ${fontSizes.extraExtraSmall};
  color: ${baseColors.darkGray};
`;

const ItemValueHolder = styled.View`
  padding: ${props => props.spacedOut ? '8px 10px' : '0px 10px 8px'};
  border-bottom-width: 1px;
  border-color: ${baseColors.gallery};
  align-items: flex-end;
  width: 100%;
`;

const ItemValue = styled(BoldText)`
  font-size: ${fontSizes.large};
  font-weight: ${fontWeights.bold};
`;

const ListItemUnderlined = (props: Props) => {
  const { label, value, spacedOut } = props;
  return (
    <ItemWrapper>
      <ItemLabel>{label}</ItemLabel>
      <ItemValueHolder spacedOut={spacedOut}>
        <ItemValue>{value}</ItemValue>
      </ItemValueHolder>
    </ItemWrapper>
  );
};

export default ListItemUnderlined;

