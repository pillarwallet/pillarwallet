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
import { spacing, fontStyles } from 'utils/variables';
import { TextLink, MediumText } from 'components/Typography';
import Spinner from 'components/Spinner';
import { themedColors } from 'utils/themes';

type Props = {
  label: string,
  value: any,
  spacedOut?: boolean,
  valueAddon?: React.Node,
  showSpinner?: boolean,
  onPress?: ?() => Promise<void>,
}

const ItemWrapper = styled.View`
  margin-top: ${spacing.mediumLarge}px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
`;

const ItemLabel = styled(MediumText)`
  text-align:center;
  ${fontStyles.small};
  color: ${themedColors.secondaryText};
`;

const ItemValueHolder = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  min-height: 50px;
`;

const ItemWrapperButton = styled.TouchableOpacity`
  padding: 10px 0;
  margin-top: -10px;
`;

const ItemValue = styled(MediumText)`
  ${fontStyles.big};
  margin-top: ${props => props.spacedOut ? '8px' : '0'};
  padding-left: ${props => props.additionalMargin ? '10px' : 0};
  text-align: right;
  max-width: 230px;
  margin-bottom: ${spacing.small}px;
`;

const Column = styled.View`
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  padding-right: ${spacing.mediumLarge}px;
  border-bottom-width: 1px;
  border-color: ${themedColors.border};
`;

const ListItemUnderlined = (props: Props) => {
  const {
    label,
    value,
    spacedOut,
    valueAddon,
    showSpinner,
    onPress,
  } = props;
  return (
    <ItemWrapper>
      <ItemLabel>{label}</ItemLabel>
      <Column>
        <ItemValueHolder>
          {valueAddon}
          <ItemValue
            spacedOut={spacedOut}
            additionalMargin={valueAddon}
            ellipsizeMode="tail"
            numberOfLines={3}
          >
            {value}
          </ItemValue>
          {!!showSpinner &&
          <Spinner width={20} height={20} style={{ marginBottom: 16, marginLeft: 10 }} />}
        </ItemValueHolder>
        {!!onPress &&
        <ItemWrapperButton onPress={onPress}>
          <TextLink>Copy to clipboard</TextLink>
        </ItemWrapperButton>}
      </Column>
    </ItemWrapper>
  );
};

export default ListItemUnderlined;
