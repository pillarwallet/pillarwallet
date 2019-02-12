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
import { baseColors, fontSizes, spacing, fontWeights, UIColors } from 'utils/variables';
import { BaseText } from 'components/Typography';
import { ScrollView, TouchableWithoutFeedback } from 'react-native';
import { CustomParsedText } from 'components/CustomParsedText';

type Props = {
  label: string,
  value: any,
}

const ItemWrapper = styled.View`
  margin-top: ${spacing.mediumLarge}px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
`;

const ItemLabel = styled(BaseText)`
  text-align:center;
  font-size: ${fontSizes.extraExtraSmall}px;
  color: ${baseColors.darkGray};
  font-weight: ${fontWeights.medium};
`;

const ItemValueHolder = styled.View`
  border-bottom-width: 1px;
  border-color: ${baseColors.gallery};
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  padding-right: ${spacing.mediumLarge}px;
  height: 50px;
`;

const StyledBaseText = styled(CustomParsedText)`
  font-size: ${fontSizes.small}px;
  color: ${UIColors.defaultTextColor};
`;

const ListItemParagraph = (props: Props) => {
  const {
    label,
    value,
  } = props;
  return (
    <ItemWrapper>
      <ItemLabel>{label}</ItemLabel>
      <ItemValueHolder>
        <ScrollView>
          <TouchableWithoutFeedback>
            <StyledBaseText text={value} />
          </TouchableWithoutFeedback>
        </ScrollView>
      </ItemValueHolder>
    </ItemWrapper>
  );
};

export default ListItemParagraph;
