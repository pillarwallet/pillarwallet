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
import { StyleSheet } from 'react-native';
import styled from 'styled-components/native';

import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { BaseText } from 'components/legacy/Typography';

import Icon from 'components/legacy/Icon';
import NativeTouchable from 'components/NativeTouchable';

const ItemRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: ${spacing.large}px ${spacing.layoutSides}px;
  min-height: 90px;
`;

const TextWrapper = styled.View`
`;

const ContentWrapper = styled.View`
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
`;

const AddonWrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ListItem = styled.View`
  ${({ bordered, theme }) => bordered && `
  border-bottom-width: ${StyleSheet.hairlineWidth}px;
  border-top-width: ${StyleSheet.hairlineWidth}px;
  border-color: ${theme.colors.basic080};
  `}
`;

const ItemLabel = styled(BaseText)`
  ${fontStyles.medium};
  color: ${({ color, theme }) => color || theme.colors.basic000};
`;

const SubText = styled(BaseText)`
  ${fontStyles.small};
  color: ${({ color, theme }) => color || theme.colors.basic030};
  margin-top: 4px;
`;

const ItemAddon = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-left: ${spacing.medium}px;
  padding-bottom: 2px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ChevronIcon = styled(Icon)`
  color: ${({ color, theme }) => color || theme.colors.basic000};
  font-size: ${fontSizes.small}px;
`;

type Props = {
  label: string,
  onPress?: () => void,
  addon?: React.Node,
  bordered?: boolean,
  color?: string,
  chevronColor?: string,
  subtext?: string,
  subtextAddon?: React.Node,
  wrapperStyle?: Object,
  chevronStyle?: Object,
  rightAddon?: React.Node,
  disabled?: boolean,
}

export const ListItemChevron = (props: Props) => {
  const {
    onPress,
    label,
    addon,
    subtextAddon,
    bordered,
    color,
    chevronColor,
    subtext,
    wrapperStyle,
    chevronStyle,
    rightAddon,
    disabled,
  } = props;
  return (
    <ListItem bordered={bordered} style={wrapperStyle}>
      <NativeTouchable onPress={onPress} disabled={disabled}>
        <ItemRow>
          <ContentWrapper>
            <TextWrapper>
              <Row>
                <ItemLabel color={color}>{label}</ItemLabel>
                {!!addon && <ItemAddon>{addon}</ItemAddon>}
              </Row>
              {!!subtext &&
              <Row>
                <SubText>{subtext}</SubText>
                {!!subtextAddon && <ItemAddon>{subtextAddon}</ItemAddon>}
              </Row>}
            </TextWrapper>
          </ContentWrapper>
          <AddonWrapper>
            {rightAddon}
            <ChevronIcon
              name="chevron-right"
              color={chevronColor || color}
              style={chevronStyle}
            />
          </AddonWrapper>
        </ItemRow>
      </NativeTouchable>
    </ListItem>
  );
};

